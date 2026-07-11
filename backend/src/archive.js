// FR-5.1 Synchronous archiving — archive rendition is written in the same flow as production output,
// never as a later job. Index entries (FR-5.2 analogue) land in archive/index.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ARCHIVE_DIR } from './store.js';
import { runHooks } from './hooks.js';
import { logger } from './logger.js';

const INDEX_FILE = path.join(ARCHIVE_DIR, 'index.json');

function readIndex() {
  return fs.existsSync(INDEX_FILE) ? JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')) : [];
}

export function archiveDocument({ txId, applicationId, sourceFile, indexFields }) {
  runHooks('pre', 'archiving', applicationId, { data: indexFields });
  const ext = path.extname(sourceFile);
  const dest = path.join(ARCHIVE_DIR, `${txId}${ext}`);
  fs.copyFileSync(sourceFile, dest);
  const bytes = fs.readFileSync(dest);
  const entry = {
    txId,
    applicationId,
    file: path.basename(dest),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    indexFields, // TLE-equivalent index metadata
    archivedAt: new Date().toISOString(),
  };
  const index = readIndex();
  index.push(entry);
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  runHooks('post', 'archiving', applicationId, { data: entry });
  logger.debug(`archived ${entry.file}`, { scope: `tx:${txId}` });
  return entry;
}

export function searchArchive(query = {}) {
  return readIndex().filter((e) =>
    Object.entries(query).every(([k, v]) => String(e.indexFields?.[k] ?? e[k]) === String(v))
  );
}
