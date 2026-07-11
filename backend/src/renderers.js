// Channel renderers consuming the UDM (FR-2.2). Print/PDF supports FR-4.4 page setup
// (size, orientation, N-up imposition) and FR-1.7 watermarks; FR-1.8 custom fonts from the font library.
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { OUT_DIR, collection, SAMPLES_DIR } from './store.js';
import { runHooks } from './hooks.js';
import { logger } from './logger.js';

const PAGE_SIZES = { A4: [595.28, 841.89], A5: [419.53, 595.28], LETTER: [612, 792], LEGAL: [612, 1008] };

function pageOpts(pageSetup) {
  let size = PAGE_SIZES[(pageSetup.size ?? 'A4').toUpperCase()] ?? PAGE_SIZES.A4;
  if (pageSetup.orientation === 'landscape') size = [size[1], size[0]];
  return { size, margin: 50 };
}

function registerFonts(doc) {
  // FR-1.8 — fonts collection: { id, name, file (under samples/fonts), licensedFor }
  for (const f of collection('fonts')) {
    const p = path.isAbsolute(f.file) ? f.file : path.join(SAMPLES_DIR, f.file);
    if (fs.existsSync(p)) {
      try { doc.registerFont(f.name, p); } catch (e) { logger.warn(`font ${f.name} failed to register: ${e.message}`); }
    }
  }
}

function applyWatermark(doc, pageSetup) {
  if (!pageSetup.watermark) return; // FR-1.7 optional — fully omitted when disabled
  const { width, height } = doc.page;
  doc.save();
  doc.rotate(-45, { origin: [width / 2, height / 2] });
  doc.fontSize(72).fillColor('#cccccc').opacity(0.35);
  doc.text(pageSetup.watermark, 0, height / 2 - 36, { width, align: 'center' });
  doc.restore().opacity(1);
}

function drawBlocks(doc, udm, { scale = 1, x = null, width = null } = {}) {
  const theme = udm.theme;
  const baseFont = theme?.font && collection('fonts').some((f) => f.name === theme.font) ? theme.font : 'Helvetica';
  for (const block of udm.blocks) {
    const fontSize = (block.style.fontSize ?? 11) * scale;
    const color = block.style.color ?? theme?.color ?? '#000000';
    const bold = block.style.bold;
    doc.font(bold && baseFont === 'Helvetica' ? 'Helvetica-Bold' : baseFont).fontSize(fontSize).fillColor(color);
    const opts = { width: width ?? doc.page.width - 100 };
    if (x !== null) opts.continued = false;
    if (block.type === 'table') {
      const header = block.columns.map((c) => c.label).join('  |  ');
      doc.text(header, x ?? undefined, undefined, opts);
      doc.moveDown(0.2);
      for (const row of block.rows) doc.text(row.join('  |  '), x ?? undefined, undefined, opts);
    } else {
      doc.text(block.text, x ?? undefined, undefined, opts);
    }
    doc.moveDown(0.6 * scale);
  }
  if (theme?.footerText) {
    doc.fontSize(8 * scale).fillColor('#888888').text(theme.footerText, x ?? undefined, undefined, { width: width ?? doc.page.width - 100 });
  }
}

// Render one or many UDM documents into a single PDF (batch merges outputs — FR-3.1).
// Returns { file, pageRanges: [{index, fromPage, toPage}] } — page ranges feed report files (FR-3.5).
export function renderPdf(udms, outName) {
  const list = Array.isArray(udms) ? udms : [udms];
  const first = list[0];
  const setup = first.pageSetup;
  const file = path.join(OUT_DIR, outName);
  const doc = new PDFDocument({ ...pageOpts(setup), autoFirstPage: false, bufferPages: true });
  registerFonts(doc);
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  const pageRanges = [];
  const nUp = Math.max(1, setup.nUp ?? 1); // FR-4.4 multiplexing

  runHooks('pre', 'rendering', first.applicationId, { data: first.data });

  if (nUp > 1) {
    // N-up imposition: grid cells per page, e.g. business cards on A4 (row-major fill)
    const cols = Math.ceil(Math.sqrt(nUp));
    const rows = Math.ceil(nUp / cols);
    let cell = 0;
    for (let i = 0; i < list.length; i++) {
      if (cell % nUp === 0) { doc.addPage(); applyWatermark(doc, setup); }
      const { width, height } = doc.page;
      const cw = (width - 60) / cols, ch = (height - 60) / rows;
      const col = (cell % nUp) % cols, row = Math.floor((cell % nUp) / cols);
      const cx = 30 + col * cw, cy = 30 + row * ch;
      doc.save();
      doc.rect(cx, cy, cw - 6, ch - 6).strokeColor('#bbbbbb').stroke(); // cut marks
      doc.y = cy + 8;
      drawBlocks(doc, list[i], { scale: 0.55, x: cx + 8, width: cw - 22 });
      doc.restore();
      const page = doc.bufferedPageRange().count;
      pageRanges.push({ index: i, fromPage: page, toPage: page });
      cell++;
    }
  } else {
    for (let i = 0; i < list.length; i++) {
      const from = doc.bufferedPageRange().count + 1;
      doc.addPage(pageOpts(list[i].pageSetup));
      applyWatermark(doc, list[i].pageSetup);
      drawBlocks(doc, list[i]);
      const to = doc.bufferedPageRange().count;
      pageRanges.push({ index: i, fromPage: from, toPage: to });
    }
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      runHooks('post', 'rendering', first.applicationId, { data: first.data, file });
      logger.debug(`rendered PDF ${outName} (${pageRanges.length} documents)`);
      resolve({ file, pageRanges });
    });
    stream.on('error', reject);
  });
}

function udmToHtml(udm) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const parts = udm.blocks.map((b) => {
    if (b.type === 'table') {
      const head = `<tr>${b.columns.map((c) => `<th align="left">${esc(c.label)}</th>`).join('')}</tr>`;
      const rows = b.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('');
      return `<table border="1" cellpadding="6" cellspacing="0">${head}${rows}</table>`;
    }
    const weight = b.style?.bold ? 'bold' : 'normal';
    return `<p style="font-weight:${weight};color:${b.style?.color ?? udm.theme?.color ?? '#000'}">${esc(b.text)}</p>`;
  });
  const footer = udm.theme?.footerText ? `<hr><small>${esc(udm.theme.footerText)}</small>` : '';
  const wm = udm.pageSetup.watermark ? `<div style="color:#ccc;font-size:40px">${esc(udm.pageSetup.watermark)}</div>` : '';
  return `<html><body style="font-family:sans-serif">${wm}${parts.join('\n')}${footer}</body></html>`;
}

// Simulated digital gateways: write the message artifact to out/gateway and emit a synthetic result.
// A recipient address containing "bounce" forces a gateway failure so failover (FR-2.1) can be demoed.
export function renderDigital(channel, udm, recipient, txId) {
  const dir = path.join(OUT_DIR, 'gateway');
  fs.mkdirSync(dir, { recursive: true });
  let file, address;
  if (channel === 'EMAIL') {
    address = recipient.email ?? '';
    file = path.join(dir, `${txId}.email.html`);
    fs.writeFileSync(file, udmToHtml(udm));
  } else {
    address = recipient.phone ?? '';
    const text = udm.blocks.filter((b) => b.type !== 'table').map((b) => b.text).join('\n');
    file = path.join(dir, `${txId}.${channel.toLowerCase()}.json`);
    fs.writeFileSync(file, JSON.stringify({ channel, to: address, text }, null, 2));
  }
  const failed = String(address).toLowerCase().includes('bounce');
  return { file, delivered: !failed, address };
}
