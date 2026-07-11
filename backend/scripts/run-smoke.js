// Boots the server as a child process, waits for /health, runs the smoke test, then shuts down.
// Used for CI-style verification: `node scripts/run-smoke.js`
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = spawn(process.execPath, [path.join(ROOT, 'src', 'server.js')], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

async function waitForHealth(tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch('http://localhost:3000/api/v1/health');
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

const up = await waitForHealth();
if (!up) {
  console.error('Server failed to start');
  server.kill();
  process.exit(1);
}

const test = spawn(process.execPath, [path.join(ROOT, 'scripts', 'smoke-test.js')], { cwd: ROOT, stdio: 'inherit' });
test.on('exit', (code) => {
  server.kill();
  process.exit(code ?? 1);
});
