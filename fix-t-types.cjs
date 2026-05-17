/**
 * For files that have `t: SomeType` (where SomeType is a translation object)
 * AND the file does `t(string)` somewhere, change the param type to
 * `SomeType & ((key: string) => string)`.
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
  // Look for `t: SOMETHING;` lines and `t(` callsites
  const tCalls = (src.match(/\bt\("/g) || []).length;
  if (tCalls === 0) continue;
  // Find `t: SOMETHING;` declarations where SOMETHING is not already callable
  const re = /\bt:\s*([A-Z]\w+(?:<[^>]+>)?(?:\[\])?);/g;
  let m;
  const changes = [];
  while ((m = re.exec(src)) !== null) {
    const typeName = m[1];
    // Skip already callable, and skip obvious non-i18n types
    if (typeName.includes('=>')) continue;
    if (/^(string|number|boolean|RefObject|MutationFunction|Date|Array|Map|Set)/.test(typeName)) continue;
    if (typeName === 'Tenant' || typeName === 'Robot' || typeName === 'User' || typeName === 'Card' || typeName === 'Card[]') continue;
    if (typeName === 'TaskTag[]' || typeName === 'TaskChecklist[]') continue;
    if (!/Translation|Translations|Locale|TranslationType|Translation\b/.test(typeName)) continue;
    // Already has intersection?
    const start = m.index;
    const lineEnd = src.indexOf('\n', start);
    const lineText = src.slice(start, lineEnd);
    if (lineText.includes('&')) continue;
    changes.push({ start, end: m.index + m[0].length, newText: `t: ${typeName} & ((key: string) => string);` });
  }
  if (changes.length === 0) continue;
  // Apply from end to start
  changes.sort((a, b) => b.start - a.start);
  for (const c of changes) {
    src = src.slice(0, c.start) + c.newText + src.slice(c.end);
  }
  fs.writeFileSync(f, src, 'utf8');
  filesEdited++;
  total += changes.length;
  console.log(`EDITED ${path.relative(ROOT, f)}: ${changes.length} changes`);
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total changes:', total);
