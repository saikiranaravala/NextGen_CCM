// Configuration loader: secrets from .env, settings from config.xml.
// Precedence: environment variables (incl. .env) > config.xml > built-in defaults.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// --- .env (secrets) — Node 21+ built-in loader; silently skipped if the file doesn't exist ---
const envFile = path.join(BACKEND_ROOT, '.env');
if (fs.existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch (err) {
    console.error(`Failed to load .env: ${err.message}`);
  }
}

// --- config.xml (non-secret settings) ---
// Minimal parser for the flat <config><section><key>value</key></section></config> shape.
function parseConfigXml(xml) {
  const out = {};
  const noComments = xml.replace(/<!--[\s\S]*?-->/g, '');
  const sectionRe = /<(\w+)>([\s\S]*?)<\/\1>/g;
  const root = noComments.match(/<config>([\s\S]*)<\/config>/);
  if (!root) return out;
  let section;
  while ((section = sectionRe.exec(root[1])) !== null) {
    const [, name, body] = section;
    out[name] = {};
    const leafRe = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let leaf;
    while ((leaf = leafRe.exec(body)) !== null) {
      out[name][leaf[1]] = leaf[2].trim();
    }
  }
  return out;
}

let xmlConfig = {};
const xmlFile = path.join(BACKEND_ROOT, 'config.xml');
if (fs.existsSync(xmlFile)) {
  xmlConfig = parseConfigXml(fs.readFileSync(xmlFile, 'utf8'));
} else {
  console.warn('config.xml not found — using built-in defaults');
}

const get = (section, key, fallback) => xmlConfig[section]?.[key] ?? fallback;

export const config = {
  server: {
    port: Number(process.env.PORT ?? get('server', 'port', 3000)),
    corsOrigin: get('server', 'corsOrigin', '*'),
  },
  ai: {
    provider: get('ai', 'provider', 'openrouter'),
    baseUrl: get('ai', 'baseUrl', 'https://openrouter.ai/api/v1/chat/completions'),
    model: process.env.OPENROUTER_MODEL ?? get('ai', 'model', 'anthropic/claude-sonnet-4.5'),
    maxTokens: Number(get('ai', 'maxTokens', 4096)),
    apiKey: process.env.OPENROUTER_API_KEY ?? null, // secret — .env only, never config.xml
  },
  storage: {
    dataDir: path.resolve(BACKEND_ROOT, get('storage', 'dataDir', 'data')),
    outDir: path.resolve(BACKEND_ROOT, get('storage', 'outDir', 'out')),
    archiveDir: path.resolve(BACKEND_ROOT, get('storage', 'archiveDir', 'archive')),
    samplesDir: path.resolve(BACKEND_ROOT, get('storage', 'samplesDir', 'samples')),
  },
  logging: {
    level: get('logging', 'level', 'info'),
  },
};
