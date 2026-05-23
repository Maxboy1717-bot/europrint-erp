// Extract every tLabel('ns.path.to.leaf', 'fallback') call from the dashboard src.
// Walks the dir tree, reads files, runs a robust regex to capture (key, fallback).
// Supports single/double/backtick quotes and escaped chars inside fallback.
//
// Usage:  node extract.mjs > extracted.json

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/src';
const TRANSLATION_MODULES = new Set([
  'common','auth','dashboard','hr','finance','production','warehouse','wms','crm','lms',
  'settings','errors','validation','marketing','navigation','public','sd','mes','kanban',
  'director','security','notifications','iot','admin','mro','design','logistics','pos',
  'ai','aisha','coordination','print','barcode','calc','contact','footer','glPosting',
  'inventory','ledger','lowstock','movements','myInventory','nav','qc','offline',
  'qcreview','quarantine','reports','requests','variance',
]);

const ALLOWED_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '__tests__']);

const files = [];
function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(full);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (ALLOWED_EXT.has(ext)) files.push(full);
    }
  }
}
walk(ROOT);

// Match tLabel(   <quoted-key>   ,    <quoted-fallback>    )
// Group 1: key (without quotes). Group 2: fallback (without quotes).
// Quote styles supported: single, double, backtick. We require fallback to be a literal
// (variable-only fallbacks like tLabel('x.y', label) are SKIPPED — they have no source string).
//
// To keep regex simple we capture the body between matching quotes greedily-but-safely
// by allowing any char except the closing quote (with backslash-escape support).

function buildRegex() {
  // key: ['"`]([^'"`\\]|\\.)+['"`]   — but we need same quote at start/end
  // Simpler: try three alternatives separately.
  return /tLabel\s*\(\s*(?:'((?:\\.|[^'\\])+)'|"((?:\\.|[^"\\])+)"|`((?:\\.|[^`\\])+)`)\s*,\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`)\s*\)/g;
}

const re = buildRegex();
const out = []; // { file, line, ns, path, fallback }
const skippedVar = []; // tLabel where fallback is non-literal (variable) — we ignore
let calls = 0;

for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!src.includes('tLabel')) continue;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(src))) {
    calls++;
    const key = m[1] ?? m[2] ?? m[3];
    let fb = m[4] ?? m[5] ?? m[6];
    if (key == null || fb == null) continue;
    // Unescape \', \", \`, \n, \t, \\
    const unescape = (s) => s.replace(/\\(['"`\\nt])/g, (_, c) => {
      if (c === 'n') return '\n';
      if (c === 't') return '\t';
      return c;
    });
    const fallback = unescape(fb);
    const firstDot = key.indexOf('.');
    if (firstDot < 1) continue;
    const ns = key.slice(0, firstDot);
    const subPath = key.slice(firstDot + 1);
    if (!TRANSLATION_MODULES.has(ns)) continue;
    // line number
    const upto = src.slice(0, m.index);
    const line = upto.split('\n').length;
    out.push({ file: f.replace(/\\/g, '/'), line, ns, path: subPath, fallback });
  }
  // Count tLabel( occurrences in this file for diagnostic — non-literal fallbacks
  const allMatches = src.match(/tLabel\s*\(/g) || [];
  // (we don't separately log these — too noisy)
}

console.error(`Scanned ${files.length} files. Matched ${calls} literal-fallback tLabel calls.`);
console.log(JSON.stringify(out, null, 2));
