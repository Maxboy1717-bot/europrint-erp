/**
 * For kanban + similar files that have:
 *   `t: typeof T.uz` or `t: typeof T.ru` parameter
 * but call `t(...)` and never `t.xxx` access, we can SAFELY change the
 * parameter type to `(key: string) => string`. This makes the callsite type-check.
 *
 * For files that DO use `t.xxx`, we leave them alone (manual fix needed).
 *
 * Heuristic — file qualifies if it has NO `t\.\w+` accesses.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.cache') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name) && !/\.(test|spec|smoke\.test)\./.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const all = walk(path.join(ROOT, 'src'));
let totalReplacements = 0;
let filesEdited = 0;

for (const f of all) {
  let src = fs.readFileSync(f, 'utf8');
  if (!/\bt:\s*typeof\s+T\.(uz|ru)/.test(src)) continue;
  const tDotMatches = src.match(/\bt\.\w+/g) || [];
  if (tDotMatches.length > 0) {
    console.log(`SKIP ${path.relative(ROOT, f)} — has ${tDotMatches.length} t.xxx accesses`);
    continue;
  }
  const original = src;
  const newSrc = src.replace(/\bt:\s*typeof\s+T\.(uz|ru)/g, 't: (key: string) => string');
  if (newSrc !== original) {
    fs.writeFileSync(f, newSrc, 'utf8');
    filesEdited++;
    const cnt = (original.match(/\bt:\s*typeof\s+T\.(uz|ru)/g) || []).length;
    totalReplacements += cnt;
    console.log(`EDITED ${path.relative(ROOT, f)}: ${cnt} param-type changes`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total param-type changes:', totalReplacements);
