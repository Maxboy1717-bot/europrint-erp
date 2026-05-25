#!/usr/bin/env node
/**
 * audit-i18n-deep.mjs — Deeper detection of i18n issues beyond strict morphology.
 *
 * Detects:
 *   1. Key === value (broken codemod entries like "Izohlang...": "Izohlang...")
 *   2. Values containing English-only words mixed into Uzbek/Russian
 *   3. UZ/RU keys with the same value (suggests untranslated)
 *   4. Key parity mismatches between UZ and RU
 *   5. Suspicious "camelCase" keys with literal-looking values
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const UZ_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/uz');
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');

// English words that are clear leaks (NOT proper Uzbek/Russian). Includes both
// pure English nouns AND tech terms that should have local equivalents.
const EN_WORDS = [
  'Lead', 'leads', 'Deal', 'Deals', 'Pipeline', 'Stage', 'Quote', 'Order',
  'Customer', 'Vendor', 'Account', 'Invoice', 'Payment', 'Receipt',
  'Status', 'Filter', 'Search', 'Save', 'Cancel', 'Delete', 'Edit', 'Add',
  'Create', 'Update', 'Submit', 'Reset', 'Close', 'Open', 'Back', 'Next',
  'Previous', 'Loading', 'Error', 'Success', 'Warning', 'Info',
  'Dashboard', 'Settings', 'Profile', 'Logout', 'Login',
  'Total', 'Subtotal', 'Discount', 'Tax', 'Amount', 'Price', 'Quantity',
  'Active', 'Inactive', 'Pending', 'Approved', 'Rejected',
  'Today', 'Yesterday', 'Tomorrow', 'Week', 'Month', 'Year',
  'Yes', 'No', 'OK', 'Confirm', 'Apply',
];

// Build regex for word-boundary detection. Some Uzbek/Russian text may
// incidentally contain these letters, so use word boundaries (\b) carefully.
const enRe = new RegExp(`\\b(${EN_WORDS.join('|')})\\b`);

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[full] = v;
    else if (typeof v === 'object' && v !== null) flatten(v, full, out);
  }
  return out;
}

function loadDir(dir) {
  const all = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const ns = f.replace(/\.json$/, '');
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    all[ns] = flatten(data);
  }
  return all;
}

const uz = loadDir(UZ_DIR);
const ru = loadDir(RU_DIR);

const issues = {
  keyEqValue: [],          // {ns, key, value} — key === value (broken codemod)
  englishWord: [],         // {ns, key, value, match}
  uzEqRu: [],              // {ns, key, value} — uz value === ru value (untranslated)
  uzMissingInRu: [],       // {ns, key} — exists in uz but not ru
  ruMissingInUz: [],       // {ns, key} — exists in ru but not uz
  emptyValue: [],          // {ns, key, lang}
  punctOnlyKey: [],        // {ns, key} — key contains spaces/punctuation
};

for (const ns of Object.keys(uz)) {
  for (const [key, val] of Object.entries(uz[ns])) {
    // 1. key === value
    if (key === val || key.toLowerCase() === String(val).toLowerCase()) {
      issues.keyEqValue.push({ ns, key, value: val, lang: 'uz' });
    }
    // 2. English word inside value
    const m = enRe.exec(val);
    if (m) issues.englishWord.push({ ns, key, value: val, match: m[1], lang: 'uz' });
    // 5. Suspicious key shape
    if (/[\s\.\?]/.test(key) && !/[a-z][A-Z]/.test(key)) {
      // key has space/dots/? but isn't camelCase
      issues.punctOnlyKey.push({ ns, key, lang: 'uz' });
    }
    // 6. Empty
    if (val === '' || val === null || val === undefined) {
      issues.emptyValue.push({ ns, key, lang: 'uz' });
    }
  }
}
for (const ns of Object.keys(ru)) {
  for (const [key, val] of Object.entries(ru[ns])) {
    if (key === val || key.toLowerCase() === String(val).toLowerCase()) {
      issues.keyEqValue.push({ ns, key, value: val, lang: 'ru' });
    }
    const m = enRe.exec(val);
    if (m) issues.englishWord.push({ ns, key, value: val, match: m[1], lang: 'ru' });
    if (val === '' || val === null || val === undefined) {
      issues.emptyValue.push({ ns, key, lang: 'ru' });
    }
  }
}

// Parity check
for (const ns of Object.keys(uz)) {
  const uzKeys = new Set(Object.keys(uz[ns]));
  const ruKeys = new Set(Object.keys(ru[ns] ?? {}));
  for (const k of uzKeys) {
    if (!ruKeys.has(k)) issues.uzMissingInRu.push({ ns, key: k });
    else if (uz[ns][k] === ru[ns][k] && /[a-zA-Z]/.test(uz[ns][k])) {
      // Only flag uz===ru when there's actual letters (digits/punct ok identical)
      issues.uzEqRu.push({ ns, key: k, value: uz[ns][k] });
    }
  }
  for (const k of ruKeys) {
    if (!uzKeys.has(k)) issues.ruMissingInUz.push({ ns, key: k });
  }
}

console.log('━━ DEEP I18N AUDIT ━━');
console.log(`Key === Value (broken):       ${issues.keyEqValue.length}`);
console.log(`English words in value:       ${issues.englishWord.length}`);
console.log(`UZ value === RU value (same): ${issues.uzEqRu.length}`);
console.log(`Keys in UZ but not RU:        ${issues.uzMissingInRu.length}`);
console.log(`Keys in RU but not UZ:        ${issues.ruMissingInUz.length}`);
console.log(`Empty values:                 ${issues.emptyValue.length}`);
console.log(`Suspicious key shape:         ${issues.punctOnlyKey.length}`);

console.log('\n━━ Sample Key===Value (top 10) ━━');
for (const e of issues.keyEqValue.slice(0, 10)) {
  console.log(`  [${e.lang}/${e.ns}] "${e.key}" → "${e.value}"`);
}

console.log('\n━━ Sample English in value (top 15) ━━');
for (const e of issues.englishWord.slice(0, 15)) {
  console.log(`  [${e.lang}/${e.ns}] ${e.key}: "${e.value}"  ← "${e.match}"`);
}

console.log('\n━━ Sample UZ=RU duplicates (top 10) ━━');
for (const e of issues.uzEqRu.slice(0, 10)) {
  console.log(`  [${e.ns}] ${e.key}: "${e.value}"`);
}

console.log('\n━━ Sample suspicious key shape (top 10) ━━');
for (const e of issues.punctOnlyKey.slice(0, 10)) {
  console.log(`  [${e.lang}/${e.ns}] "${e.key}"`);
}

fs.writeFileSync('audit-i18n-deep.json', JSON.stringify(issues, null, 2));
console.log('\nFull report: audit-i18n-deep.json');
