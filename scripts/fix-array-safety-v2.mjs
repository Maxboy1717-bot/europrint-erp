#!/usr/bin/env node
/**
 * Array-safety auto-fixer (v2 — portable, no shell deps).
 *
 * Transforms the safest, lowest-risk patterns only:
 *   1.  (X ?? []).method(    →  (Array.isArray(X) ? X : []).method(
 *   2.  ((X) ?? []).method(  →  (Array.isArray(X) ? X : []).method(
 *   3.  X.data.method(       →  (Array.isArray(X.data) ? X.data : []).method(
 *       where X is `result` (Result-pattern unwrap)
 *
 * These are the canonical safe rewrites. More aggressive transforms (bare
 * `var.method(`) require per-site analysis and are left to manual review.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SCAN_DIRS = [
  join(ROOT, 'apps', 'api', 'src'),
  join(ROOT, 'artifacts', 'erp-dashboard', 'src'),
];

function walk(dir, ext) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return []; }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name === '.next') continue;
    if (name === '__tests__' || name === 'locales' || name === 'test') continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...walk(p, ext));
    else if (ext.some((e) => name.endsWith(e)) && !name.includes('.spec.') && !name.includes('.test.')) out.push(p);
  }
  return out;
}

const ARRAY_METHODS = ['map', 'filter', 'reduce', 'forEach', 'find', 'findIndex', 'some', 'every', 'flatMap', 'sort'];
const METHODS_RE = ARRAY_METHODS.join('|');

let totalFiles = 0;
let totalRewrites = 0;
const perFile = [];

const files = [
  ...walk(SCAN_DIRS[0], ['.ts']),
  ...walk(SCAN_DIRS[1], ['.ts', '.tsx']),
];

for (const file of files) {
  let src;
  try { src = readFileSync(file, 'utf-8'); } catch { continue; }
  const before = src;

  // Pattern A: (someVar ?? []).method(
  src = src.replace(
    new RegExp(`\\(([a-zA-Z_$][a-zA-Z0-9_$]*(?:\\??\\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\\s*\\?\\?\\s*\\[\\]\\)\\s*\\.\\s*(${METHODS_RE})\\s*\\(`, 'g'),
    (_m, varExpr, method) => `(Array.isArray(${varExpr}) ? ${varExpr} : []).${method}(`,
  );

  // Pattern B: result.data.method(  (specific to Result-pattern unwraps)
  src = src.replace(
    new RegExp(`(\\b(?:result|res|r|response)\\.data)\\s*\\.\\s*(${METHODS_RE})\\s*\\(`, 'g'),
    (_m, expr, method) => `(Array.isArray(${expr}) ? ${expr} : []).${method}(`,
  );

  if (src !== before) {
    writeFileSync(file, src, 'utf-8');
    const rewriteCount = (before.match(/\?\? \[\]/g) || []).length + (before.match(/\b(result|res|r|response)\.data\.(map|filter|reduce|forEach|find|findIndex|some|every|flatMap|sort)\(/g) || []).length;
    totalFiles += 1;
    totalRewrites += rewriteCount;
    perFile.push({ file: file.replace(ROOT, '').replace(/\\/g, '/'), rewriteCount });
  }
}

console.log(`Files scanned : ${files.length}`);
console.log(`Files rewritten : ${totalFiles}`);
console.log(`Total rewrites : ${totalRewrites}`);
console.log('\nTop 10 changes:');
for (const f of perFile.slice(0, 10)) console.log(`  ${String(f.rewriteCount).padStart(3)}  ${f.file}`);
