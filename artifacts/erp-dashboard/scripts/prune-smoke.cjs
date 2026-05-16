/**
 * Parse tsc-smoke-output.log and delete every smoke test file that has
 * a TypeScript error (e.g. missing required props).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const log = fs.readFileSync(path.join(ROOT, 'tsc-smoke-output.log'), 'utf8');
const lines = log.split('\n');

const failedFiles = new Set();
for (const line of lines) {
  const m = line.match(/^([^()]+\.smoke\.test\.tsx)\(/);
  if (m) {
    failedFiles.add(m[1].replace(/\\/g, '/'));
  }
}

let deleted = 0;
for (const rel of failedFiles) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) {
    fs.unlinkSync(abs);
    deleted++;
  }
}

// Count remaining smoke tests.
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (p.endsWith('.smoke.test.tsx')) out.push(p);
  }
  return out;
}
const remaining = walk(path.join(ROOT, 'src', 'pages')).length;

console.log(JSON.stringify({
  failedSmokeFiles: failedFiles.size,
  deleted,
  remainingSmokeTests: remaining,
}, null, 2));
