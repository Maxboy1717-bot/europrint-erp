/**
 * Replace `as { [key: string]: unknown }` with `as Record<string, any>` to
 * avoid TS2322 errors when downstream code expects strings/numbers.
 *
 * Using `any` here is OK because the code's intent is clearly "I trust the API
 * shape" — adding the cast was already a soft assertion.
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
for (const f of all) {
  let src = fs.readFileSync(f, 'utf8');
  if (!/as \{ \[key: string\]: unknown \}/.test(src)) continue;
  const newSrc = src.replace(/as \{ \[key: string\]: unknown \}/g, 'as Record<string, any>');
  if (newSrc !== src) {
    fs.writeFileSync(f, newSrc, 'utf8');
    total++;
    console.log('EDITED', path.relative(ROOT, f));
  }
}
console.log('Total files edited:', total);
