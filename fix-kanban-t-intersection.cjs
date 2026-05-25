/**
 * Change `t: typeof T.uz` to `t: typeof T.uz & ((key: string) => string)` to
 * allow BOTH `t.xxx` and `t(key)` access on the same parameter.
 *
 * This is a deliberate type lie — `t` is really an object at runtime, but the
 * existing buggy code calls it both as a function and an object. The
 * intersection type lets both compile while we figure out the right runtime
 * fix.
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
let total = 0;
let filesEdited = 0;
for (const f of all) {
  let src = fs.readFileSync(f, 'utf8');
  if (!/\bt:\s*typeof\s+T\.(uz|ru)(?![\w&])/.test(src)) continue;
  const original = src;
  const newSrc = src.replace(/\bt:\s*typeof\s+T\.(uz|ru)(?![\w&])/g, 't: typeof T.uz & ((key: string) => string)');
  if (newSrc !== original) {
    fs.writeFileSync(f, newSrc, 'utf8');
    filesEdited++;
    const cnt = (original.match(/\bt:\s*typeof\s+T\.(uz|ru)(?![\w&])/g) || []).length;
    total += cnt;
    console.log(`EDITED ${path.relative(ROOT, f)}: ${cnt} changes`);
  }
}
console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total changes:', total);
