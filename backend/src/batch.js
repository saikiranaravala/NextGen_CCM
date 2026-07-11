// FR-3.1 batch engine (driver files CSV/JSON), FR-3.5 production report files, FR-3.6 selective reprint.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { OUT_DIR, SAMPLES_DIR, collection, save, findById } from './store.js';
import { composeUDM } from './compose.js';
import { renderPdf } from './renderers.js';
import { getApprovedTemplate } from './orchestrator.js';
import { newTransaction, addEvent, sealLedger, attachArtifact } from './tracking.js';
import { archiveDocument } from './archive.js';
import { runHooks } from './hooks.js';
import { logger } from './logger.js';

// Minimal CSV parser (header row; no embedded commas in MVP driver files).
export function parseDriverFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) return JSON.parse(raw);
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

export async function runBatch({ templateId, driverFile, reportFields }) {
  const tpl = getApprovedTemplate(templateId);
  const jobId = `job_${crypto.randomBytes(5).toString('hex')}`;
  const scope = `job:${jobId}`;
  const driverPath = path.isAbsolute(driverFile) ? driverFile : path.join(SAMPLES_DIR, driverFile);
  if (!fs.existsSync(driverPath)) throw Object.assign(new Error(`Driver file not found: ${driverFile}`), { status: 404 });

  logger.info(`batch ${jobId} starting: ${templateId} <- ${driverFile}`, { scope });
  let records = parseDriverFile(driverPath);

  // FR-13.2 pre-ingestion hooks may normalize records
  const ing = runHooks('pre', 'ingestion', tpl.applicationId, { data: { records } });
  records = ing.ctx.data.records ?? records;
  runHooks('post', 'ingestion', tpl.applicationId, { data: { count: records.length } });

  const udms = [];
  const txIds = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const tx = newTransaction({
      id: `tx_${jobId}_${i}`,
      kind: 'batch-record',
      templateId: tpl.id,
      templateVersion: tpl.version,
      applicationId: tpl.applicationId,
      recipient: { customer_id: record.customer_id ?? String(i) },
    });
    const udm = composeUDM(tpl, record, { scope });
    addEvent(tx.id, 'Composed');
    sealLedger(tx.id, tpl.id, tpl.version, record);
    udms.push(udm);
    txIds.push(tx.id);
  }

  const outName = `${jobId}.pdf`;
  const { file, pageRanges } = await renderPdf(udms, outName);
  runHooks('pre', 'post_processing', tpl.applicationId, { data: { jobId, file } });

  // FR-3.5 — report file with configurable field mapping from input records
  const fields = reportFields?.length ? reportFields : Object.keys(records[0] ?? {}).slice(0, 4);
  const report = records.map((record, i) => ({
    recordIndex: i,
    txId: txIds[i],
    ...Object.fromEntries(fields.map((f) => [f, record[f] ?? null])),
    fromPage: pageRanges[i].fromPage,
    toPage: pageRanges[i].toPage,
    outputFile: outName,
  }));
  const reportFile = path.join(OUT_DIR, `${jobId}.report.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  runHooks('post', 'post_processing', tpl.applicationId, { data: { jobId, reportFile } });

  for (let i = 0; i < txIds.length; i++) {
    addEvent(txIds[i], 'Dispatched', { channel: 'PRINT', job: jobId });
    addEvent(txIds[i], 'Delivered', { channel: 'PRINT' });
    attachArtifact(txIds[i], { channel: 'PRINT', file, pages: [pageRanges[i].fromPage, pageRanges[i].toPage] });
  }
  // FR-5.1 — archive the production file synchronously with the run
  archiveDocument({
    txId: jobId,
    applicationId: tpl.applicationId,
    sourceFile: file,
    indexFields: { templateId: tpl.id, templateVersion: tpl.version, records: records.length, kind: 'batch-master' },
  });

  const job = {
    id: jobId,
    templateId: tpl.id,
    templateVersion: tpl.version,
    applicationId: tpl.applicationId,
    driverFile,
    records: records.length,
    outputFile: outName,
    reportFile: path.basename(reportFile),
    completedAt: new Date().toISOString(),
  };
  collection('jobs').push(job);
  save('jobs');
  logger.info(`batch ${jobId} complete: ${records.length} records -> ${outName}`, { scope });
  return { job, report };
}

// FR-3.6 — selective reprint: re-generate specific records from a finished batch using its report file.
export async function reprint(jobId, recordIndexes) {
  const job = findById('jobs', jobId);
  if (!job) throw Object.assign(new Error(`Job not found: ${jobId}`), { status: 404 });
  const report = JSON.parse(fs.readFileSync(path.join(OUT_DIR, job.reportFile), 'utf8'));
  const tpl = findById('templates', job.templateId);
  const records = parseDriverFile(path.join(SAMPLES_DIR, job.driverFile));

  const wanted = report.filter((r) => recordIndexes.includes(r.recordIndex));
  if (!wanted.length) throw Object.assign(new Error('No matching records in report file'), { status: 400 });

  const udms = wanted.map((r) => composeUDM(tpl, records[r.recordIndex], { scope: `job:${jobId}` }));
  const outName = `${jobId}.reprint.${Date.now()}.pdf`;
  const { file } = await renderPdf(udms, outName);
  for (const r of wanted) addEvent(r.txId, 'Dispatched', { channel: 'PRINT', reprint: true }); // audit-logged (FR-6.1)
  logger.info(`reprint from ${jobId}: records [${recordIndexes.join(', ')}] -> ${outName}`);
  return { file: outName, records: wanted.map((r) => r.recordIndex) };
}
