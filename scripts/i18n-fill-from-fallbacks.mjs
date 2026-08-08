#!/usr/bin/env node
/**
 * i18n-fill-from-fallbacks.mjs — P2 (MASSIV cleanup).
 * Scans every FE .tsx/.ts for tLabel("ns.key","fallback") and 2-arg t("key","fallback")
 * calls, and fills any MISSING locale key with the EXACT in-source fallback (mechanical —
 * NO guessed translations). uz = fallback; uz-cyr = transliterated; ru = fallback placeholder
 * (so the missing-key warning stops in every language; a real RU pass can refine later).
 *   node scripts/i18n-fill-from-fallbacks.mjs        # report only
 *   node scripts/i18n-fill-from-fallbacks.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translitLatToCyr } from '../_tlabel_tmp/translit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'artifacts/erp-dashboard/src');
const LOC = path.join(ROOT, 'artifacts/erp-dashboard/src/locales');
const APPLY = process.argv.includes('--apply');

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/node_modules|__tests__|\.test\./.test(e.name)) walk(p, out); }
    else if (/\.(tsx?|jsx?)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) out.push(p);
  }
  return out;
}

// tLabel("ns.key", "fallback")  — fallback may contain escaped quotes
const RE_TLABEL = /tLabel\(\s*(['"])([^'"]+?)\1\s*,\s*(['"])((?:\.|(?!\3).)*)\3/g;
// 2-arg t("key", "fallback") — ns from the file's useTranslation
const RE_T2 = /[^.\w]t\(\s*(['"])([^'".]+?)\1\s*,\s*(['"])((?:\.|(?!\3).)*)\3/g;
const RE_NS = /useTranslation\(\s*['"]([a-z-]+)['"]\s*\)/;

const want = {}; // ns -> { key -> fallback }
function add(ns, key, fb) {
  if (!ns || !key) return;
  (want[ns] ??= {});
  if (!(key in want[ns])) want[ns][key] = fb.split('\\"').join('"').split("\\'").join("'");
}

for (const f of walk(SRC)) {
  const src = fs.readFileSync(f, 'utf8');
  const fileNs = (src.match(RE_NS)?.[1]) ?? 'common';
  for (const m of src.matchAll(RE_TLABEL)) {
    const full = m[2]; const dot = full.indexOf('.');
    if (dot < 0) continue;
    add(full.slice(0, dot), full.slice(dot + 1), m[4]);
  }
  for (const m of src.matchAll(RE_T2)) add(fileNs, m[2], m[4]);
}

const readJson = (p) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
let totalMissing = 0, added = 0;
let missUz = 0, missRu = 0, missCyr = 0;
const sample = [];
for (const ns of Object.keys(want).sort()) {
  const uzP = path.join(LOC, 'uz', `${ns}.json`);
  if (!fs.existsSync(uzP)) continue; // unknown namespace → skip (no such locale file)
  const uz = readJson(uzP), ru = readJson(path.join(LOC, 'ru', `${ns}.json`)), cyr = readJson(path.join(LOC, 'uz-cyr', `${ns}.json`));
  let nsMiss = 0;
  for (const [key, fb] of Object.entries(want[ns])) {
    const missingSomewhere = !(key in uz) || !(key in ru) || !(key in cyr);
    if (!missingSomewhere) continue;
    if (!(key in uz)) missUz++;
    if (!(key in ru)) missRu++;
    if (!(key in cyr)) missCyr++;
    nsMiss++; totalMissing++;
    if (sample.length < 15) sample.push(`${ns}:${key}`);
    if (APPLY) {
      // uz = real Uzbek fallback (mechanical, correct). uz-cyr = deterministic transliteration.
      // ru is intentionally NOT mass-filled with the Uzbek fallback: ru users already see this uz
      // text via the loader fallback chain, and writing 573 non-Cyrillic values would regress RU
      // coverage + risk the i18n-status --fail gate. Real RU goes through the translate-uz-ru pipeline.
      if (!(key in uz)) uz[key] = fb;
      if (!(key in cyr)) cyr[key] = translitLatToCyr(fb);
      added++;
    }
  }
  if (nsMiss && APPLY) {
    fs.writeFileSync(uzP, JSON.stringify(uz, null, 2) + '\n');
    fs.writeFileSync(path.join(LOC, 'uz-cyr', `${ns}.json`), JSON.stringify(cyr, null, 2) + '\n');
  }
  if (nsMiss) console.log(`  ${ns.padEnd(14)} missing=${nsMiss}`);
}
console.log(`\nTOTAL missing keys (some lang): ${totalMissing}${APPLY ? `  | filled=${added}` : '  (report only)'}`);
console.log(`  per-lang missing → uz=${missUz}  ru=${missRu}  uz-cyr=${missCyr}`);
if (sample.length) console.log('e.g. ' + sample.join(', '));
