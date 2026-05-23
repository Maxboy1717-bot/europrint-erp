#!/usr/bin/env node
/**
 * Find Russian (Cyrillic) text leaking into uz/*.json — entries that should be Uzbek
 * but contain Russian fragments.
 */
import fs from 'node:fs';
import path from 'node:path';

const UZ_DIR = path.join(process.cwd(), 'artifacts/erp-dashboard/src/locales/uz');
const CYRILLIC = /[Ѐ-ӿ]/;
const LATIN = /[A-Za-z]/;

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[full] = v;
    else if (typeof v === 'object' && v !== null) flatten(v, full, out);
  }
  return out;
}

const issues = [];
for (const fname of fs.readdirSync(UZ_DIR)) {
  if (!fname.endsWith('.json')) continue;
  const ns = fname.replace(/\.json$/, '');
  const data = JSON.parse(fs.readFileSync(path.join(UZ_DIR, fname), 'utf8'));
  const flat = flatten(data);
  for (const [key, val] of Object.entries(flat)) {
    if (typeof val !== 'string') continue;
    if (CYRILLIC.test(val)) {
      issues.push({ ns, key, value: val });
    }
  }
}

console.log(`━━ RUSSIAN-IN-UZ AUDIT ━━`);
console.log(`Suspected Russian-in-UZ: ${issues.length}`);
console.log(`\n━━ Sample (top 30) ━━`);
for (const e of issues.slice(0, 30)) {
  console.log(`  [${e.ns}] ${e.key}: "${e.value}"`);
}

fs.writeFileSync('audit-i18n-ru-in-uz.json', JSON.stringify(issues, null, 2));
console.log(`\nFull report: audit-i18n-ru-in-uz.json (${issues.length} entries)`);
