// Simple JSON-file-backed store. Each collection persists to data/<name>.json.
// Stands in for the platform database; swap for Postgres+RLS in production (PRD §4.2).
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

export const DATA_DIR = config.storage.dataDir;
export const OUT_DIR = config.storage.outDir;
export const ARCHIVE_DIR = config.storage.archiveDir;
export const SAMPLES_DIR = config.storage.samplesDir;

for (const dir of [DATA_DIR, OUT_DIR, ARCHIVE_DIR]) fs.mkdirSync(dir, { recursive: true });

const cache = new Map();

function fileFor(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function collection(name, seed = []) {
  if (!cache.has(name)) {
    const f = fileFor(name);
    if (fs.existsSync(f)) cache.set(name, JSON.parse(fs.readFileSync(f, 'utf8')));
    else cache.set(name, structuredClone(seed));
  }
  return cache.get(name);
}

export function save(name) {
  fs.writeFileSync(fileFor(name), JSON.stringify(cache.get(name) ?? [], null, 2));
}

export function upsert(name, item, idField = 'id') {
  const col = collection(name);
  const i = col.findIndex((x) => x[idField] === item[idField]);
  if (i >= 0) col[i] = item;
  else col.push(item);
  save(name);
  return item;
}

export function findById(name, id, idField = 'id') {
  return collection(name).find((x) => x[idField] === id);
}
