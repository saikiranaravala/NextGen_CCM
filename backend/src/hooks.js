// FR-13.2 Lifecycle Scripting Hooks — sandboxed JS (node:vm) pre/post hooks at every pipeline stage.
// Hooks are stored per application in the "hooks" collection:
//   { id, applicationId, stage: "pre_ingestion"|"post_ingestion"|"pre_composition"|..., code, enabled }
// Hook code runs with a `ctx` object: { stage, data, record, log(msg) } and may mutate ctx.record/ctx.data.
import vm from 'node:vm';
import { collection } from './store.js';
import { logger } from './logger.js';

export const STAGES = [
  'ingestion',
  'lookup',
  'composition',
  'rendering',
  'post_processing',
  'delivery',
  'archiving',
];

const QUOTA_MS = 500; // FR-13.1 per-script time quota: runaway hook fails itself, not the pipeline

export function runHooks(phase, stage, applicationId, ctx) {
  const key = `${phase}_${stage}`; // e.g. pre_ingestion, post_delivery
  const hooks = collection('hooks').filter(
    (h) => h.enabled !== false && h.stage === key && (h.applicationId === applicationId || h.applicationId === '*')
  );
  const fired = [];
  for (const hook of hooks) {
    try {
      const sandbox = {
        ctx: { ...ctx, stage: key },
        log: (msg) => logger.info(`[hook:${hook.id}] ${msg}`, { scope: `hook:${hook.id}` }),
      };
      vm.createContext(sandbox);
      new vm.Script(hook.code, { filename: `hook:${hook.id}` }).runInContext(sandbox, { timeout: QUOTA_MS });
      // Copy back mutations made through ctx
      if (sandbox.ctx.record !== undefined) ctx.record = sandbox.ctx.record;
      if (sandbox.ctx.data !== undefined) ctx.data = sandbox.ctx.data;
      fired.push(hook.id);
      logger.debug(`hook fired: ${hook.id} at ${key}`);
    } catch (err) {
      // FR-13.1: a failing/runaway script fails itself, never the batch node
      logger.error(`hook ${hook.id} failed at ${key}: ${err.message}`);
    }
  }
  return { ctx, fired };
}
