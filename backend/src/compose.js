// FR-1.2 Unified Document Model — compiles template + payload (+ theme, rules, lookups) into a UDM object
// that every renderer (print PDF, email HTML, SMS text) consumes.
// FR-3.4 Secondary reference lookups. FR-8.1 conditional-content rules. FR-1.6 themes. FR-1.3 locking.
import fs from 'node:fs';
import path from 'node:path';
import { findById, SAMPLES_DIR } from './store.js';
import { runHooks } from './hooks.js';
import { logger } from './logger.js';

// Resolve "{{a.b.c}}" against a data object; unresolved paths become "".
export function interpolate(text, data) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{\s*([\w.[\]]+)\s*\}\}/g, (_, p) => {
    const v = getPath(data, p);
    return v === undefined || v === null ? '' : String(v);
  });
}

export function getPath(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// FR-8.1 — rule: { field, op: eq|ne|gt|lt|in|exists, value }
export function evalRule(rule, data) {
  if (!rule) return true;
  const v = getPath(data, rule.field);
  switch (rule.op) {
    case 'eq': return v == rule.value;
    case 'ne': return v != rule.value;
    case 'gt': return Number(v) > Number(rule.value);
    case 'lt': return Number(v) < Number(rule.value);
    case 'in': return Array.isArray(rule.value) && rule.value.includes(v);
    case 'exists': return v !== undefined && v !== null && v !== '';
    default: throw new Error(`Unknown rule op: ${rule.op}`);
  }
}

// FR-3.4 — lookups: [{ name, source (json file keyed by lookup key), key ("{{field}}") }]
export function resolveLookups(template, data, scope) {
  const out = {};
  for (const lk of template.lookups ?? []) {
    const file = path.isAbsolute(lk.source) ? lk.source : path.join(SAMPLES_DIR, lk.source);
    if (!fs.existsSync(file)) {
      logger.warn(`lookup source missing: ${lk.source}`, { scope });
      continue;
    }
    const table = JSON.parse(fs.readFileSync(file, 'utf8'));
    const key = interpolate(lk.key, data);
    out[lk.name] = table[key];
    logger.trace(`lookup ${lk.name}[${key}] -> ${out[lk.name] ? 'hit' : 'miss'}`, { scope });
  }
  return out;
}

// Main entry: template + payload -> UDM document.
export function composeUDM(template, payload, { scope } = {}) {
  const theme = template.themeId ? findById('themes', template.themeId) : null;

  let ctx = { data: { ...payload }, record: payload };
  runHooks('pre', 'lookup', template.applicationId, ctx);
  const lookup = resolveLookups(template, ctx.data, scope);
  ctx.data = { ...ctx.data, lookup };
  runHooks('post', 'lookup', template.applicationId, ctx);

  runHooks('pre', 'composition', template.applicationId, ctx);
  const blocks = [];
  for (const block of template.blocks ?? []) {
    if (!evalRule(block.rule, ctx.data)) continue; // FR-8.1 conditional content
    const resolved = {
      id: block.id,
      type: block.type ?? 'text',
      locked: !!block.locked, // FR-1.3 — carried through so downstream editors honor it
      style: { ...(theme?.blockStyle ?? {}), ...(block.style ?? {}) },
    };
    if (block.type === 'table') {
      const rows = getPath(ctx.data, block.rows) ?? [];
      resolved.columns = block.columns;
      resolved.rows = rows.map((r) => block.columns.map((c) => interpolate(String(r[c.key] ?? ''), ctx.data)));
    } else {
      resolved.text = interpolate(block.text ?? '', ctx.data);
    }
    blocks.push(resolved);
  }

  const udm = {
    templateId: template.id,
    templateVersion: template.version,
    applicationId: template.applicationId,
    theme: theme ? { name: theme.name, color: theme.color, font: theme.font, footerText: interpolate(theme.footerText ?? '', ctx.data) } : null,
    pageSetup: { size: 'A4', orientation: 'portrait', nUp: 1, watermark: null, duplex: false, ...(template.pageSetup ?? {}) }, // FR-4.4 + FR-1.7
    blocks,
    data: ctx.data,
  };
  runHooks('post', 'composition', template.applicationId, { ...ctx, udm });
  logger.debug(`composed UDM for ${template.id} v${template.version} (${blocks.length} blocks)`, { scope });
  return udm;
}
