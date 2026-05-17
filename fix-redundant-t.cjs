/**
 * Remove `const { t } = useTranslation(...)` that I incorrectly added at the
 * top of a function whose parameter already provides `t`.
 *
 * Pattern targeted:
 *   }) {
 *     const { t } = useTranslation(...);   ← my addition
 *
 * BUT only if the destructured parameter list (within last 30 lines before)
 * has `t,` or `t}` or `t:` (indicating `t` is a param).
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/src/';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(ROOT);
let totalRemoved = 0;
let filesEdited = 0;

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const original = src;
  const lines = src.split('\n');
  const toDelete = new Set();

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!/^\s*const \{ t \} = useTranslation\(/.test(ln)) continue;
    // Look backwards up to 50 lines for a function signature with `t,` or `t:` parameter
    let foundParamT = false;
    let inFunc = false;
    for (let j = i - 1; j >= Math.max(0, i - 50); j--) {
      const pl = lines[j];
      // Look for `}) {` or `) {` on a line
      if (/^\s*\}\)\s*(?::\s*\w+(?:<[^>]*>)?\s*)?\{/.test(pl) || /\)\s*(?::\s*\w+(?:<[^>]*>)?\s*)?\{\s*$/.test(pl)) {
        inFunc = true;
        // continue backward to look for `t` in params
        continue;
      }
      // Look for params with `t` as a key/destructure
      if (inFunc) {
        // Match patterns like `  t,` or `  t:` or `t }`
        if (/^\s*t\s*[,}]/.test(pl) || /^\s*t\s*:\s*\w/.test(pl) || /,\s*t\s*[,}]/.test(pl) || /\{\s*t\s*[,}]/.test(pl)) {
          foundParamT = true;
          break;
        }
        // Stop if we hit another function declaration or `{` at column 0
        if (/^(export\s+)?(default\s+)?function\s+/.test(pl) || /^\s*\{\s*$/.test(pl) || /^\}\s*$/.test(pl)) break;
      }
    }
    if (foundParamT) toDelete.add(i);
  }

  if (toDelete.size === 0) continue;

  const newLines = lines.filter((_, idx) => !toDelete.has(idx));
  const newSrc = newLines.join('\n');
  if (newSrc !== original) {
    fs.writeFileSync(f, newSrc, 'utf8');
    filesEdited++;
    totalRemoved += toDelete.size;
    console.log(`EDITED ${path.relative(ROOT, f)}: removed ${toDelete.size} decls`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total removed:', totalRemoved);
