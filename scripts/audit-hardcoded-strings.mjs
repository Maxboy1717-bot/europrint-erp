#!/usr/bin/env node
/**
 * Find hardcoded user-facing text strings in TSX files that don't go through
 * `t(...)` or a `useTranslation()` hook. Outputs file:line:snippet for review.
 *
 * Heuristic: a JSX text node `>Text here<`, or string literal that contains
 * at least 4 letters AND at least one space, AND is NOT:
 *   - already wrapped by `t(...)`
 *   - inside a className/data-testid/key prop
 *   - a CSS class or HTML attribute value
 *   - a hex / numeric literal
 *
 * Exit 0 always (read-only audit).
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const FE = join(ROOT, 'artifacts', 'erp-dashboard', 'src');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'test' || name === '__tests__' || name === 'locales') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(FE);
let totalHits = 0;
const fileHits = [];

const JSX_TEXT = />[ \t]*([A-ZА-Яa-zа-я][^<>{}\n]{3,})[ \t]*</g;

for (const f of files) {
  const src = readFileSync(f, 'utf-8');
  const lines = src.split('\n');
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.includes('t(') || ln.includes('useTranslation')) continue;       // already i18n
    // JSX text content: > LITERAL <
    let m;
    JSX_TEXT.lastIndex = 0;
    while ((m = JSX_TEXT.exec(ln)) !== null) {
      const text = m[1].trim();
      if (text.length < 4) continue;
      if (/^\d+$/.test(text)) continue;                                     // numeric
      if (/^[0-9.]+$/.test(text)) continue;
      if (!/[a-zA-Zа-яА-Я]{2}/.test(text)) continue;                        // require letters
      if (/^(true|false|null|undefined)$/.test(text)) continue;
      hits.push({ line: i + 1, text });
    }
  }
  if (hits.length > 0) {
    fileHits.push({ file: f.replace(ROOT, '').replace(/^[\\/]/, ''), hits: hits.length, samples: hits.slice(0, 3) });
    totalHits += hits.length;
  }
}

fileHits.sort((a, b) => b.hits - a.hits);

const top = fileHits.slice(0, 30);

console.log(`Hardcoded JSX text scan`);
console.log(`Files scanned : ${files.length}`);
console.log(`Files with hardcoded JSX text : ${fileHits.length}`);
console.log(`Total hardcoded text spots    : ${totalHits}`);
console.log('\nTop 30 offenders:');
for (const f of top) {
  console.log(`  ${String(f.hits).padStart(4)}  ${f.file}`);
  for (const s of f.samples) console.log(`         L${s.line}: "${s.text.slice(0, 60)}"`);
}

writeFileSync(join(ROOT, 'scripts', 'i18n-hardcoded-report.json'), JSON.stringify({ totalHits, fileCount: fileHits.length, top: top.slice(0, 50) }, null, 2));
console.log('\nFull report: scripts/i18n-hardcoded-report.json');
