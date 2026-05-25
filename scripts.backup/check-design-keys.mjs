#!/usr/bin/env node
/** Check coverage: design-page t() keys vs uz/common.json + uz/design.json (and ru). */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const PAGES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'pages');
const LOCALES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');

const DSGN_PAGES = readdirSync(PAGES).filter((f) =>
  (f.startsWith('Design') || f.startsWith('AIDesign')) && f.endsWith('.tsx')
);

const keys = new Set();
for (const f of DSGN_PAGES) {
  const src = readFileSync(join(PAGES, f), 'utf-8');
  for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) keys.add(m[1]);
}

function flatten(obj, prefix = '') {
  const out = new Set();
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const x of flatten(v, key)) out.add(x);
    else out.add(key);
  }
  return out;
}
function readNs(lang, ns) {
  try { return flatten(JSON.parse(readFileSync(join(LOCALES, lang, `${ns}.json`), 'utf-8'))); } catch { return new Set(); }
}

const uzAll = new Set([...readNs('uz', 'common'), ...readNs('uz', 'design')]);
const ruAll = new Set([...readNs('ru', 'common'), ...readNs('ru', 'design')]);
const missingUz = [...keys].filter(k => !uzAll.has(k));
const missingRu = [...keys].filter(k => !ruAll.has(k));

console.log(`Design pages scanned: ${DSGN_PAGES.length}`);
console.log(`Total unique t() keys: ${keys.size}`);
console.log(`Missing in UZ (common+design): ${missingUz.length}`);
console.log(`Missing in RU (common+design): ${missingRu.length}`);
if (missingUz.length) { console.log('\n--- missing UZ ---'); for (const k of missingUz.sort().slice(0, 30)) console.log('  ' + k); }
if (missingRu.length) { console.log('\n--- missing RU ---'); for (const k of missingRu.sort().slice(0, 30)) console.log('  ' + k); }
