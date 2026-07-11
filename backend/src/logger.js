// FR-6.4 Configurable Log Levels — runtime-switchable, per scope (global or per job/tenant).
const LEVELS = ['trace', 'debug', 'info', 'warn', 'error'];

const state = {
  global: 'info',
  scopes: new Map(), // scopeKey (e.g. "job:123", "tenant:acme") -> level
};

function levelIndex(l) {
  const i = LEVELS.indexOf(l);
  if (i === -1) throw new Error(`Unknown log level: ${l}. Valid: ${LEVELS.join(', ')}`);
  return i;
}

export function setLogLevel(level, scope = 'global') {
  levelIndex(level);
  if (scope === 'global') state.global = level;
  else state.scopes.set(scope, level);
  return getLogConfig();
}

export function getLogConfig() {
  return { global: state.global, scopes: Object.fromEntries(state.scopes) };
}

function effectiveLevel(scope) {
  if (scope && state.scopes.has(scope)) return state.scopes.get(scope);
  return state.global;
}

export function log(level, message, { scope, ...meta } = {}) {
  if (levelIndex(level) < levelIndex(effectiveLevel(scope))) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    ...(scope ? { scope } : {}),
    message,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  trace: (msg, meta) => log('trace', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

export const LOG_LEVELS = LEVELS;
