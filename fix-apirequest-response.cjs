/**
 * Same fix as fix-apirequest-res.cjs but for variable name `response` and `r`.
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

const allFiles = walk(path.join(ROOT, 'src'));

let totalReplacements = 0;
let filesEdited = 0;

function fixVar(src, vname) {
  let count = 0;
  // PATTERN A — simple `const VNAME = await apiRequest(...); return VNAME.json();`
  const reSimple = new RegExp(`^(?<indent>[ \\t]*)const\\s+${vname}\\s*=\\s*await\\s+apiRequest\\((?<args>[^;]+)\\);\\r?\\n[ \\t]*return\\s+(?:await\\s+)?${vname}\\.json\\(\\);`, 'gm');
  src = src.replace(reSimple, (m, ...rest) => {
    const groups = rest.at(-1);
    count++;
    return `${groups.indent}return await apiRequest(${groups.args});`;
  });
  // PATTERN B — `const VNAME = await apiRequest(...);\n if (!VNAME.ok) throw new Error(...);\n return VNAME.json();`
  const reB = new RegExp(`^(?<indent>[ \\t]*)const\\s+${vname}\\s*=\\s*await\\s+apiRequest\\((?<args>[^;]+)\\);\\r?\\n[ \\t]*if\\s*\\(\\s*!\\s*${vname}\\.ok\\s*\\)\\s*throw new Error\\([^;]*\\);\\r?\\n[ \\t]*return\\s+(?:await\\s+)?${vname}\\.json\\(\\);`, 'gm');
  src = src.replace(reB, (m, ...rest) => {
    const groups = rest.at(-1);
    count++;
    return `${groups.indent}return await apiRequest(${groups.args});`;
  });
  // PATTERN C — block check
  const reC = new RegExp(`^(?<indent>[ \\t]*)const\\s+${vname}\\s*=\\s*await\\s+apiRequest\\((?<args>[^;]+)\\);\\r?\\n[ \\t]*if\\s*\\(\\s*!\\s*${vname}\\.ok\\s*\\)\\s*\\{[^{}]*?throw[^{}]*?\\}\\r?\\n[ \\t]*return\\s+(?:await\\s+)?${vname}\\.json\\(\\);`, 'gm');
  src = src.replace(reC, (m, ...rest) => {
    const groups = rest.at(-1);
    count++;
    return `${groups.indent}return await apiRequest(${groups.args});`;
  });
  // PATTERN D — `const VNAME = ...; if (!VNAME.ok) { ... throw ... }` (no return after)
  const reD = new RegExp(`^(?<indent>[ \\t]*)const\\s+${vname}\\s*=\\s*await\\s+apiRequest\\((?<args>[^;]+)\\);\\r?\\n[ \\t]*if\\s*\\(\\s*!\\s*${vname}\\.ok\\s*\\)\\s*\\{[^{}]*?throw[^{}]*?\\}(?!\\s*\\r?\\n[ \\t]*(?:return|const|let|var)\\s)`, 'gm');
  src = src.replace(reD, (m, ...rest) => {
    const groups = rest.at(-1);
    count++;
    return `${groups.indent}await apiRequest(${groups.args});`;
  });
  // PATTERN E — `const VNAME = ...; const X = await VNAME.json();`
  const reE = new RegExp(`^(?<indent>[ \\t]*)const\\s+${vname}\\s*=\\s*await\\s+apiRequest\\((?<args>[^;]+)\\);\\r?\\n[ \\t]*const\\s+(?<varName>\\w+)\\s*=\\s*await\\s+${vname}\\.json\\(\\);`, 'gm');
  src = src.replace(reE, (m, ...rest) => {
    const groups = rest.at(-1);
    count++;
    return `${groups.indent}const ${groups.varName} = (await apiRequest(${groups.args})) as { [key: string]: unknown };`;
  });
  return { src, count };
}

for (const f of allFiles) {
  let src = fs.readFileSync(f, 'utf8');
  if (!/const\s+(response|r)\s*=\s*await\s+apiRequest/.test(src)) continue;
  const original = src;
  let total = 0;
  for (const vname of ['response', 'r']) {
    const res = fixVar(src, vname);
    src = res.src;
    total += res.count;
  }
  if (src !== original) {
    fs.writeFileSync(f, src, 'utf8');
    filesEdited++;
    totalReplacements += total;
    console.log(`EDITED ${path.relative(ROOT, f)}: ${total} replacements`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total replacements:', totalReplacements);
