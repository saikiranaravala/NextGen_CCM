// FR-2.1 state-driven journeys with failover, FR-2.2 channels, FR-2.3 idempotency,
// FR-3.2 on-demand composition. Ties together compose → render → dispatch → track → archive.
import crypto from 'node:crypto';
import { findById, collection, save } from './store.js';
import { composeUDM } from './compose.js';
import { renderPdf, renderDigital } from './renderers.js';
import { newTransaction, addEvent, attachArtifact, sealLedger } from './tracking.js';
import { archiveDocument } from './archive.js';
import { runHooks } from './hooks.js';
import { logger } from './logger.js';

// FR-2.3 — idempotency map: key -> transaction id
function findByIdempotencyKey(key) {
  return key ? collection('transactions').find((t) => t.idempotencyKey === key) : undefined;
}

export function getApprovedTemplate(templateId, { allowDraft = false } = {}) {
  const tpl = findById('templates', templateId);
  if (!tpl) throw Object.assign(new Error(`Template not found: ${templateId}`), { status: 404 });
  if (tpl.status !== 'approved' && !allowDraft) {
    throw Object.assign(new Error(`Template ${templateId} is not approved (status: ${tpl.status})`), { status: 409 });
  }
  return tpl;
}

// Main on-demand entry (PRD §5.2 contract). Returns { tx, replayed }.
export async function executeOnDemand({ template_id, idempotency_key, recipient = {}, payload = {}, allowDraft = false, kind = 'on-demand' }) {
  const existing = findByIdempotencyKey(idempotency_key);
  if (existing) {
    logger.info(`idempotent replay for key ${idempotency_key} -> ${existing.id}`);
    return { tx: existing, replayed: true };
  }

  const tpl = getApprovedTemplate(template_id, { allowDraft });
  const txId = `tx_ccm_${crypto.randomBytes(6).toString('hex')}`;
  const tx = newTransaction({
    id: txId,
    kind,
    templateId: tpl.id,
    templateVersion: tpl.version,
    applicationId: tpl.applicationId,
    idempotencyKey: idempotency_key,
    recipient,
  });

  const udm = composeUDM(tpl, payload, { scope: `tx:${txId}` });
  addEvent(txId, 'Composed');
  sealLedger(txId, tpl.id, tpl.version, payload); // FR-6.2

  // Channel plan: preferred + fallbacks (FR-2.1). Default journey ends in PRINT (always "deliverable").
  const prefs = recipient.preferences ?? {};
  const plan = [prefs.preferred_channel, prefs.fallback_channel, 'PRINT']
    .filter(Boolean)
    .map((c) => c.toUpperCase())
    .filter((c, i, a) => a.indexOf(c) === i);

  let deliveredVia = null;
  for (const channel of plan) {
    runHooks('pre', 'delivery', tpl.applicationId, { data: udm.data, channel });
    addEvent(txId, 'Dispatched', { channel });
    let result;
    if (channel === 'PRINT') {
      const { file } = await renderPdf(udm, `${txId}.pdf`);
      result = { file, delivered: true, address: 'print-stream' };
    } else {
      result = renderDigital(channel, udm, recipient, txId); // EMAIL / SMS / WHATSAPP / PUSH simulated
    }
    attachArtifact(txId, { channel, file: result.file });
    addEvent(txId, 'Gateway Handshake', { channel, address: result.address });
    runHooks('post', 'delivery', tpl.applicationId, { data: udm.data, channel, delivered: result.delivered });

    if (result.delivered) {
      addEvent(txId, 'Delivered', { channel });
      deliveredVia = channel;
      // FR-5.1 synchronous archive — same flow, not a later job
      const archiveSource = channel === 'PRINT' ? result.file : result.file;
      archiveDocument({
        txId,
        applicationId: tpl.applicationId,
        sourceFile: archiveSource,
        indexFields: {
          customerId: recipient.customer_id ?? payload.customer_id ?? null,
          templateId: tpl.id,
          templateVersion: tpl.version,
          channel,
        },
      });
      break;
    }
    addEvent(txId, 'Failed', { channel, reason: 'gateway rejected (simulated bounce)' });
    logger.warn(`channel ${channel} failed for ${txId}; trying next in plan`, { scope: `tx:${txId}` });
  }

  const t = findById('transactions', txId);
  t.deliveredVia = deliveredVia;
  save('transactions');
  return { tx: t, replayed: false };
}
