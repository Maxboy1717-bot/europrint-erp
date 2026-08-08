// READ-ONLY advisor analysis: true reachability from the app entry (main.tsx).
// A page reachable through real imports / lazy(import()) from main.tsx is ALIVE.
// Anything else is DEAD — including dead islands (de-routed pages importing only each other).
import fs from 'node:fs';
import path from 'node:path';
const SRC = path.resolve('artifacts/erp-dashboard/src');
const PAGES = path.join(SRC, 'pages');
const ENTRY = path.join(SRC, 'main.tsx');

function resolve(spec, fromDir) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('./') || spec.startsWith('../')) base = path.resolve(fromDir, spec);
  else return null; // package import — out of tree
  const tries = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
  for (const t of tries) { const f = base + t; if (fs.existsSync(f) && fs.statSync(f).isFile()) return path.resolve(f); }
  return null;
}
const IMP = /(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
function importsOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const fromDir = path.dirname(file);
  const out = [];
  for (const m of src.matchAll(IMP)) {
    const spec = m[1] || m[2];
    if (!spec) continue;
    const r = resolve(spec, fromDir);
    if (r) out.push(r);
  }
  return out;
}

// BFS reachability from entry
const reachable = new Set();
const queue = [path.resolve(ENTRY)];
while (queue.length) {
  const f = queue.pop();
  if (reachable.has(f)) continue;
  reachable.add(f);
  try { for (const dep of importsOf(f)) if (!reachable.has(dep)) queue.push(dep); } catch {}
}

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (/\.(tsx?|jsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}
const isTest = f => /\.(test|spec)\./.test(f) || /\.smoke\./.test(f);
const pages = walk(PAGES).filter(p => !isTest(p));
const dead = pages.filter(p => !reachable.has(path.resolve(p)));
const rel = p => path.relative(SRC, p).split(path.sep).join('/');
console.log(`entry reachable files: ${reachable.size}`);
console.log(`page files: ${pages.length}  |  reachable: ${pages.length - dead.length}  |  TRULY DEAD (unreachable from main.tsx): ${dead.length}`);
console.log('---DEAD (first 60)---');
dead.map(rel).sort().slice(0, 60).forEach(p => console.log(p));
