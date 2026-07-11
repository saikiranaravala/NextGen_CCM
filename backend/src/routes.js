// REST API (PRD §5.2 contract + admin/design surfaces).
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { collection, save, findById, upsert, OUT_DIR } from './store.js';
import { executeOnDemand } from './orchestrator.js';
import { runBatch, reprint } from './batch.js';
import { composeUDM } from './compose.js';
import { renderPdf } from './renderers.js';
import { verifyLedger } from './tracking.js';
import { searchArchive } from './archive.js';
import { setLogLevel, getLogConfig, LOG_LEVELS, logger } from './logger.js';
import { draftLetter, conversationalEdit, applyEdits } from './ai.js';

export const api = express.Router();

// Shared template-save path: version bump, locked-block enforcement (FR-1.3/1.4), draft status (FR-1.5).
function saveTemplateVersion(tpl, { unlock = false } = {}) {
  const existing = findById('templates', tpl.id);
  if (existing) {
    const history = collection('templateVersions');
    history.push({ ...existing, archivedAt: new Date().toISOString() });
    save('templateVersions');
    tpl.version = (existing.version ?? 1) + 1;
    if (!unlock) {
      for (const old of existing.blocks.filter((b) => b.locked)) {
        const incoming = tpl.blocks.find((b) => b.id === old.id);
        if (!incoming || JSON.stringify(incoming) !== JSON.stringify(old)) {
          throw Object.assign(new Error(`Block '${old.id}' is locked (FR-1.3); pass ?unlock=1 as designer to modify`), { status: 403 });
        }
      }
    }
  } else {
    tpl.version = 1;
  }
  tpl.status = 'draft';
  tpl.applicationId = tpl.applicationId ?? 'app_default';
  upsert('templates', tpl);
  return tpl;
}

function wrap(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      logger.error(err.message, { path: req.path });
      res.status(err.status ?? 500).json({ error: err.message });
    }
  };
}

api.get('/health', (req, res) => res.json({ status: 'ok', service: 'nextgen-ccm', version: '0.1.0' }));

// ---- Applications (FR-14.1) ----
api.get('/applications', (req, res) => res.json(collection('applications')));

// ---- Themes (FR-1.6) / Fonts (FR-1.8) / Paragraph library (FR-1.5/1.9) ----
api.get('/themes', (req, res) => res.json(collection('themes')));
api.get('/fonts', (req, res) => res.json(collection('fonts')));
api.get('/paragraphs', (req, res) => {
  const app = req.query.applicationId;
  res.json(collection('paragraphs').filter((p) => !app || p.applicationId === app || p.applicationId === '*'));
});

// ---- Templates (FR-1.1–1.5) ----
api.get('/templates', (req, res) => {
  const app = req.query.applicationId; // FR-14.1 scoping
  res.json(collection('templates').filter((t) => !app || t.applicationId === app));
});
api.get('/templates/:id', (req, res) => {
  const tpl = findById('templates', req.params.id);
  if (!tpl) return res.status(404).json({ error: 'not found' });
  res.json(tpl);
});
api.post('/templates', wrap(async (req, res) => {
  const tpl = req.body;
  if (!tpl.id || !tpl.blocks) throw Object.assign(new Error('id and blocks are required'), { status: 400 });
  saveTemplateVersion(tpl, { unlock: !!req.query.unlock });
  res.status(201).json(tpl);
}));
api.post('/templates/:id/approve', wrap(async (req, res) => {
  const tpl = findById('templates', req.params.id);
  if (!tpl) throw Object.assign(new Error('not found'), { status: 404 });
  tpl.status = 'approved';
  tpl.approvedBy = req.body?.approver ?? 'demo-approver';
  tpl.approvedAt = new Date().toISOString();
  save('templates');
  res.json(tpl);
}));
api.get('/templates/:id/versions', (req, res) => {
  res.json(collection('templateVersions').filter((t) => t.id === req.params.id));
});

// Draft preview (design-time proof; FR-10.x lightweight stand-in)
api.post('/templates/:id/preview', wrap(async (req, res) => {
  const tpl = findById('templates', req.params.id);
  if (!tpl) throw Object.assign(new Error('not found'), { status: 404 });
  const udm = composeUDM({ ...tpl, pageSetup: { ...tpl.pageSetup, watermark: tpl.pageSetup?.watermark ?? 'DRAFT' } }, req.body ?? {});
  const name = `preview_${tpl.id}_${Date.now()}.pdf`;
  await renderPdf(udm, name);
  res.json({ file: `/out/${name}`, udm });
}));

// ---- On-demand communications (FR-3.2, PRD §5.2) ----
api.post('/communications/on-demand', wrap(async (req, res) => {
  const { tx, replayed } = await executeOnDemand(req.body);
  res.status(replayed ? 200 : 202).json({
    transaction_id: tx.id,
    status: replayed ? tx.status : 'QUEUED',
    replayed,
    delivered_via: tx.deliveredVia ?? null,
    audit_trail_url: `/api/v1/audit/${tx.id}`,
  });
}));

// ---- Batch (FR-3.1/3.5/3.6) ----
api.post('/batch', wrap(async (req, res) => {
  const { templateId, driverFile, reportFields } = req.body;
  const result = await runBatch({ templateId, driverFile, reportFields });
  res.status(201).json(result);
}));
api.get('/batch', (req, res) => res.json(collection('jobs')));
api.get('/batch/:jobId', (req, res) => {
  const job = findById('jobs', req.params.jobId);
  if (!job) return res.status(404).json({ error: 'not found' });
  const report = JSON.parse(fs.readFileSync(path.join(OUT_DIR, job.reportFile), 'utf8'));
  res.json({ job, report });
});
api.post('/batch/:jobId/reprint', wrap(async (req, res) => {
  const result = await reprint(req.params.jobId, req.body.recordIndexes ?? []);
  res.status(201).json(result);
}));

// ---- Track & trace / audit (FR-6.1/6.2) ----
api.get('/transactions', (req, res) => {
  const list = collection('transactions');
  res.json(list.slice(-200).reverse());
});
api.get('/audit/:txId', (req, res) => {
  const tx = findById('transactions', req.params.txId);
  if (!tx) return res.status(404).json({ error: 'not found' });
  res.json(tx);
});
api.post('/audit/:txId/verify', wrap(async (req, res) => {
  res.json(verifyLedger(req.params.txId, req.body));
}));

// ---- Archive (FR-5.1) ----
api.get('/archive', (req, res) => res.json(searchArchive(req.query)));

// ---- Hooks (FR-13.2) ----
api.get('/hooks', (req, res) => res.json(collection('hooks')));
api.post('/hooks', wrap(async (req, res) => {
  const { id, applicationId = '*', stage, code, enabled = true } = req.body;
  if (!id || !stage || !code) throw Object.assign(new Error('id, stage, code required'), { status: 400 });
  upsert('hooks', { id, applicationId, stage, code, enabled });
  res.status(201).json(findById('hooks', id));
}));

// ---- AI (FR-7.1 / FR-7.4, via OpenRouter) ----
api.post('/ai/draft-letter', wrap(async (req, res) => {
  const { intent, customerName, applicationId } = req.body;
  if (!intent) throw Object.assign(new Error('intent is required'), { status: 400 });
  const result = await draftLetter({ intent, customerName: customerName ?? 'Customer', applicationId });
  res.json(result);
}));

api.post('/ai/template-edit', wrap(async (req, res) => {
  const { templateId, instruction, dryRun } = req.body;
  if (!templateId || !instruction) throw Object.assign(new Error('templateId and instruction are required'), { status: 400 });
  const tpl = findById('templates', templateId);
  if (!tpl) throw Object.assign(new Error('template not found'), { status: 404 });

  const { summary, edits, model } = await conversationalEdit(tpl, instruction);
  const { template: edited, skipped } = applyEdits(tpl, edits); // FR-1.3 re-enforced server-side

  if (!dryRun && edits.length > skipped.length) {
    // Saved as a new draft version through the standard path — versioned + attributed + requires re-approval
    edited.lastEdit = { by: 'ai-conversational-edit', instruction, model, at: new Date().toISOString() };
    saveTemplateVersion(edited, { unlock: false });
  }
  res.json({ summary, edits, skipped, saved: !dryRun && edits.length > skipped.length, template: edited, model });
}));

// ---- Admin: log levels (FR-6.4) ----
api.get('/admin/log-level', (req, res) => res.json({ ...getLogConfig(), valid: LOG_LEVELS }));
api.post('/admin/log-level', wrap(async (req, res) => {
  const { level, scope } = req.body;
  res.json(setLogLevel(level, scope ?? 'global'));
}));
