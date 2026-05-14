#!/usr/bin/env node
/**
 * Audit i18n locale parity:
 *   - keys present in uz but not ru (and vice-versa)
 *   - empty string values in either language
 *   - English-looking values in either language (Cyrillic missing AND no Uzbek-Latin markers)
 *   - non-string values
 *
 * Usage:  node scripts/audit-i18n.mjs
 * Exit 0 always (audit is read-only). Stdout is structured JSON-summary + table.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const LOCALES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');

function readJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

// English-looking heuristic: only ASCII letters/digits/spaces, no Cyrillic,
// not a single short word like "OK" or "USD".
function looksEnglish(v) {
  if (typeof v !== 'string') return false;
  if (v.trim().length === 0) return false;
  if (v.length < 4) return false;
  if (/[Ѐ-ӿ]/.test(v)) return false;        // Cyrillic present → not pure English
  if (/[oO]['`]z|sh|gʻ|qish|chiq|kerak|yangi|tahrir/i.test(v)) return false;  // Uzbek-Latin markers
  if (/^[A-Za-z][\w\s'.,\-:?!()/&]+$/.test(v)) {
    // Has at least 2 English-looking words OR is clearly English (contains "the", "and", etc.)
    if (/\b(the|and|or|of|for|with|new|edit|create|delete|please|enter|select|loading|error|success|cancel|save|continue|details|name|email|password|search)\b/i.test(v)) return true;
    if (v.split(/\s+/).length >= 2) return true;
  }
  return false;
}

const uzDir = join(LOCALES, 'uz');
const ruDir = join(LOCALES, 'ru');
const modules = readdirSync(uzDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

const report = { modules: {}, summary: { totalKeys: 0, onlyInUz: 0, onlyInRu: 0, emptyInUz: 0, emptyInRu: 0, englishInUz: 0, englishInRu: 0 } };

for (const mod of modules) {
  const uz = flatten(readJson(join(uzDir, `${mod}.json`)));
  const ru = flatten(readJson(join(ruDir, `${mod}.json`)));
  const uzKeys = new Set(Object.keys(uz));
  const ruKeys = new Set(Object.keys(ru));
  const allKeys = new Set([...uzKeys, ...ruKeys]);

  const m = {
    total: allKeys.size,
    onlyInUz: [...uzKeys].filter((k) => !ruKeys.has(k)),
    onlyInRu: [...ruKeys].filter((k) => !uzKeys.has(k)),
    emptyInUz: [],
    emptyInRu: [],
    englishInUz: [],
    englishInRu: [],
  };

  for (const k of allKeys) {
    const u = uz[k];
    const r = ru[k];
    if (u === '' || u === null) m.emptyInUz.push(k);
    if (r === '' || r === null) m.emptyInRu.push(k);
    if (typeof u === 'string' && looksEnglish(u)) m.englishInUz.push({ k, v: u });
    if (typeof r === 'string' && looksEnglish(r)) m.englishInRu.push({ k, v: r });
  }

  report.modules[mod] = m;
  report.summary.totalKeys += m.total;
  report.summary.onlyInUz += m.onlyInUz.length;
  report.summary.onlyInRu += m.onlyInRu.length;
  report.summary.emptyInUz += m.emptyInUz.length;
  report.summary.emptyInRu += m.emptyInRu.length;
  report.summary.englishInUz += m.englishInUz.length;
  report.summary.englishInRu += m.englishInRu.length;
}

console.log('━━ i18n Audit Summary ━━');
console.log(`Modules : ${modules.length}`);
console.log(`Keys total : ${report.summary.totalKeys}`);
console.log(`Only in UZ : ${report.summary.onlyInUz}`);
console.log(`Only in RU : ${report.summary.onlyInRu}`);
console.log(`Empty in UZ: ${report.summary.emptyInUz}`);
console.log(`Empty in RU: ${report.summary.emptyInRu}`);
console.log(`English in UZ: ${report.summary.englishInUz}`);
console.log(`English in RU: ${report.summary.englishInRu}`);
console.log('━━ Per-module ━━');
console.log('mod\ttotal\tonlyUz\tonlyRu\temptyUz\temptyRu\tengUz\tengRu');
for (const [mod, m] of Object.entries(report.modules)) {
  console.log([mod, m.total, m.onlyInUz.length, m.onlyInRu.length, m.emptyInUz.length, m.emptyInRu.length, m.englishInUz.length, m.englishInRu.length].join('\t'));
}

writeFileSync(join(ROOT, 'scripts', 'i18n-audit-report.json'), JSON.stringify(report, null, 2));
console.log('\nReport: scripts/i18n-audit-report.json');
