/** Remove temporary smoke-test build artifacts (logs, config, pages-list). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const toRemove = [
  'tsc-smoke-output.log',
  'tsc-output.log',
  'tsconfig.smoke.json',
  'pages-list.txt',
  'smoke-results.json',
  'smoke-stderr.log',
  'smoke-sample.log',
];
let removed = 0;
for (const f of toRemove) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) { fs.unlinkSync(p); removed++; }
}

// Count final smoke tests under src/pages.
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (p.endsWith('.smoke.test.tsx')) out.push(p);
  }
  return out;
}
const remaining = walk(path.join(ROOT, 'src', 'pages')).length;
console.log(JSON.stringify({ removedArtifacts: removed, finalSmokeTests: remaining }));
