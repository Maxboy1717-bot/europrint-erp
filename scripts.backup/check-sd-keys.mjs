#!/usr/bin/env node
/** Check coverage: which SD page t() keys are missing from common.json (uz + ru). */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const PAGES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'pages');
const LOCALES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');

const SD_PAGES = [
  'SDDashboard.tsx','SDCustomers.tsx','SDSalesQuotes.tsx','SDSalesOrders.tsx',
  'SDSalesPayments.tsx','SDContracts.tsx','SDKpi.tsx','SDSettings.tsx',
  'SDExtended.tsx','SDQuotaDashboard.tsx','AiCrmPage.tsx',
  'PapkaOrders.tsx','OrderWorkflowPage.tsx',
];

const keys = new Set();
for (const f of SD_PAGES) {
  const src = readFileSync(join(PAGES, f), 'utf-8');
  // Match t('key') or t("key")
  for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) keys.add(m[1]);
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

const uzCommon = flatten(JSON.parse(readFileSync(join(LOCALES, 'uz', 'common.json'), 'utf-8')));
const ruCommon = flatten(JSON.parse(readFileSync(join(LOCALES, 'ru', 'common.json'), 'utf-8')));

const missingUz = [];
const missingRu = [];
for (const k of keys) {
  if (!uzCommon.has(k)) missingUz.push(k);
  if (!ruCommon.has(k)) missingRu.push(k);
}

console.log(`Total t() keys across ${SD_PAGES.length} SD pages: ${keys.size}`);
console.log(`Missing in uz/common.json: ${missingUz.length}`);
console.log(`Missing in ru/common.json: ${missingRu.length}`);
if (missingUz.length) {
  console.log('\n--- missing UZ keys (showing first 30) ---');
  for (const k of missingUz.sort().slice(0, 30)) console.log(`  ${k}`);
}
if (missingRu.length) {
  console.log('\n--- missing RU keys (showing first 30) ---');
  for (const k of missingRu.sort().slice(0, 30)) console.log(`  ${k}`);
}
