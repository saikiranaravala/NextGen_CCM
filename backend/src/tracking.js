// FR-6.1 Universal Track & Trace + FR-6.2 Cryptographic Integrity Ledger.
import crypto from 'node:crypto';
import { collection, save, findById } from './store.js';
import { logger } from './logger.js';

// Lifecycle: Triggered → Composed → Dispatched → GatewayHandshake → Delivered → Read (or Failed)
export function newTransaction({ id, kind, templateId, templateVersion, applicationId, idempotencyKey, recipient }) {
  const tx = {
    id,
    kind, // on-demand | batch-record | author-letter
    templateId,
    templateVersion,
    applicationId,
    idempotencyKey: idempotencyKey ?? null,
    recipient: recipient ?? null,
    status: 'TRIGGERED',
    events: [],
    ledger: null,
    artifacts: [],
    createdAt: new Date().toISOString(),
  };
  collection('transactions').push(tx);
  addEvent(tx.id, 'Triggered');
  return tx;
}

export function addEvent(txId, state, meta = {}) {
  const tx = findById('transactions', txId);
  if (!tx) throw new Error(`Unknown transaction ${txId}`);
  tx.events.push({ state, ts: new Date().toISOString(), ...meta });
  tx.status = state.toUpperCase().replace(/\s+/g, '_');
  save('transactions');
  logger.info(`tx ${txId}: ${state}`, { scope: `tx:${txId}`, ...meta });
  return tx;
}

export function attachArtifact(txId, artifact) {
  const tx = findById('transactions', txId);
  tx.artifacts.push(artifact);
  save('transactions');
}

// FR-6.2 — hash(template id + version + canonicalized input data). Proves exactly what was
// communicated without storing a second rendered copy.
export function computeLedgerHash(templateId, templateVersion, payload) {
  // Canonical form: recursively sorted keys so the hash is stable regardless of property order.
  const sortKeys = (v) => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
    }
    return v;
  };
  const canonical = JSON.stringify(sortKeys({ templateId, templateVersion, payload }));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function sealLedger(txId, templateId, templateVersion, payload) {
  const tx = findById('transactions', txId);
  tx.ledger = {
    algorithm: 'SHA-256',
    hash: computeLedgerHash(templateId, templateVersion, payload),
    sealedAt: new Date().toISOString(),
  };
  save('transactions');
  return tx.ledger;
}

export function verifyLedger(txId, payload) {
  const tx = findById('transactions', txId);
  if (!tx?.ledger) return { valid: false, reason: 'no ledger entry' };
  const recomputed = computeLedgerHash(tx.templateId, tx.templateVersion, payload);
  return { valid: recomputed === tx.ledger.hash, expected: tx.ledger.hash, recomputed };
}
