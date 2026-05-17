/**
 * Cast remaining `const VNAME = await apiRequest(...)` for VNAME in
 * (response, r, data, kitData, result, detailRes, kitDetailsRes).
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

const VARS = ['response', 'r', 'detailRes', 'kitDetailsRes', 'kitData'];

for (const f of all) {
  let src = fs.readFileSync(f, 'utf8');
  let total = 0;
  for (const v of VARS) {
    const re = new RegExp(`^(?<indent>[ \\t]*)const\\s+${v}\\s*=\\s*await\\s+apiRequest\\((?<args>[^;]+)\\);(?!\\s*(?:\\/\\/|\\/\\*))`, 'gm');
    src = src.replace(re, (m, ...rest) => {
      const groups = rest.at(-1);
      if (groups.args.includes('as unknown') || groups.args.includes('Response')) return m;
      // Only cast if the file actually uses VNAME.ok / .json() / .status — to limit scope
      const usesResponseSurface = new RegExp(`\\b${v}\\.(json|ok|status|text|headers)\\b`).test(src);
      if (!usesResponseSurface) return m;
      total++;
      return `${groups.indent}const ${v} = (await apiRequest(${groups.args})) as unknown as Response;`;
    });
  }
  if (total > 0) {
    fs.writeFileSync(f, src, 'utf8');
    filesEdited++;
    totalReplacements += total;
    console.log(`EDITED ${path.relative(ROOT, f)}: ${total} casts`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total casts:', totalReplacements);
