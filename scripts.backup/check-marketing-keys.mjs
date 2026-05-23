#!/usr/bin/env node
/** Check which marketing-page t() keys are missing from common.json + marketing.json (uz/ru). */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const PAGES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'pages');
const LOCALES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');

const MKT_PAGES = readdirSync(PAGES).filter((f) => f.startsWith('Marketing') && f.endsWith('.tsx'));

const keys = new Set();
const pageKeyMap = {};
for (const f of MKT_PAGES) {
  const src = readFileSync(join(PAGES, f), 'utf-8');
  const pageKeys = [];
  for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) { keys.add(m[1]); pageKeys.push(m[1]); }
  pageKeyMap[f] = pageKeys.length;
}

function flatten(obj, prefix = '') {
  const out = new Set();
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const x of flatten(v, key)) out.add(x);
    } else {
      out.add(key);
    }
  }
  return out;
}

function readNs(lang, ns) {
  try { return flatten(JSON.parse(readFileSync(join(LOCALES, lang, `${ns}.json`), 'utf-8'))); }
  catch { return new Set(); }
}

const uzCommon = readNs('uz', 'common');
const ruCommon = readNs('ru', 'common');
const uzMkt = readNs('uz', 'marketing');
const ruMkt = readNs('ru', 'marketing');

const missingUz = [];
const missingRu = [];
for (const k of keys) {
  const inUz = uzCommon.has(k) || uzMkt.has(k);
  const inRu = ruCommon.has(k) || ruMkt.has(k);
  if (!inUz) missingUz.push(k);
  if (!inRu) missingRu.push(k);
}

console.log(`Marketing pages scanned: ${MKT_PAGES.length}`);
console.log(`Total unique t() keys: ${keys.size}`);
console.log(`Missing in UZ (common+marketing): ${missingUz.length}`);
console.log(`Missing in RU (common+marketing): ${missingRu.length}`);

console.log('\nPer-page key counts:');
for (const f of MKT_PAGES.sort()) console.log(`  ${f}: ${pageKeyMap[f]} keys`);

if (missingUz.length) {
  console.log('\n--- missing UZ keys ---');
  for (const k of missingUz.sort().slice(0, 30)) console.log(`  ${k}`);
  if (missingUz.length > 30) console.log(`  ... and ${missingUz.length - 30} more`);
}
if (missingRu.length) {
  console.log('\n--- missing RU keys ---');
  for (const k of missingRu.sort().slice(0, 30)) console.log(`  ${k}`);
  if (missingRu.length > 30) console.log(`  ... and ${missingRu.length - 30} more`);
}
