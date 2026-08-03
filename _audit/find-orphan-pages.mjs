import fs from 'node:fs';
import path from 'node:path';
const SRC = path.resolve('artifacts/erp-dashboard/src');
const PAGES = path.join(SRC, 'pages');

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}
const all = walk(SRC);

// resolve a specifier (from importer dir) to an absolute existing file path, or null
function resolve(spec, fromDir) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('./') || spec.startsWith('../')) base = path.resolve(fromDir, spec);
  else return null; // package import
  const tries = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
  for (const t of tries) { const f = base + t; if (fs.existsSync(f) && fs.statSync(f).isFile()) return path.resolve(f); }
  return null;
}

const isTest = f => /\.(test|spec)\./.test(f) || /\.smoke\./.test(f);
const referenced = new Set();
const IMP = /(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
for (const f of all) {
  if (isTest(f)) continue; // tests are not "active" consumers — a page kept alive only by its test is an orphan
  const src = fs.readFileSync(f, 'utf8');
  const fromDir = path.dirname(f);
  for (const m of src.matchAll(IMP)) {
    const spec = m[1] || m[2];
    if (!spec) continue;
    const r = resolve(spec, fromDir);
    if (r && r !== path.resolve(f)) referenced.add(r);
  }
}

const pages = walk(PAGES).filter(p => !isTest(p));
const orphans = pages.filter(p => !referenced.has(path.resolve(p)));
const rel = p => path.relative(SRC, p).split(path.sep).join('/');
console.log(`pages total: ${pages.length}  |  referenced: ${pages.length - orphans.length}  |  ORPHANS: ${orphans.length}`);
console.log('---ORPHANS---');
orphans.map(rel).sort().forEach(p => console.log(p));
