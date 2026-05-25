#!/usr/bin/env node
/**
 * fix-i18n-leaks.mjs — patch the real English-leaks in UZ/RU locale files.
 * Only the ones where a translation is meaningful (not technical names like
 * ZPL/MacBook).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const LOCALES = 'artifacts/erp-dashboard/src/locales';

// [file, key (dot path), uzNew?, ruNew?]   undefined = keep existing
const fixes = [
  // common.json — 2 RU + 4 UZ
  ['common.json', 'hrPerformanceAi', 'HR ish samaradorligi AI',            'HR — производительность AI'],
  ['common.json', 'hrOffboarding',    "HR — ishdan bo'shatish",             'HR — увольнение'],
  ['common.json', 'newInProgressC0',  null,                                  'НОВЫЙ, В РАБОТЕ, C0:НОВЫЙ...'],
  ['common.json', 'previousPassrateUpLatestPassrate', null, null],          // code artifact, skip

  // UZ-only obvious English leftovers from the strict audit
  ['ai.json',          'demandForecast.next1m',     '1 oydan keyin',         null],
  ['ai.json',          'demandForecast.next3m',     '3 oydan keyin',         null],
  ['ai.json',          'demandForecast.avgConfidence', "O'rtacha ishonch",   null],
  ['auth.json',        'loggingIn',                 "Kirish jarayonida...",  null],
  ['barcode.json',     'notifyAdmin',               "Administratorga xabar berish", null],
  ['common.json',      'currentRatio',              'Joriy nisbat',          null],
  ['common.json',      'more1',                     "Yana...",                null],
  ['common.json',      'email1',                    "Email manzil",          null],

  // finance.json quickRatio — both languages
  ['finance.json',     'quickRatio',                'Tezkor nisbat',         'Коэффициент быстрой ликвидности'],
];

function setByPath(obj, path, val) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) return false;
    o = o[parts[i]];
  }
  if (!(parts[parts.length - 1] in o)) return false;
  o[parts[parts.length - 1]] = val;
  return true;
}

let touched = 0;
for (const [file, key, uzNew, ruNew] of fixes) {
  if (uzNew !== null) {
    const p = `${LOCALES}/uz/${file}`;
    try {
      const obj = JSON.parse(readFileSync(p, 'utf-8'));
      if (setByPath(obj, key, uzNew)) {
        writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
        console.log(`  UZ ${file} ${key} → ${JSON.stringify(uzNew)}`);
        touched++;
      }
    } catch (e) { console.error(`UZ ${file} ${key}: ${e.message}`); }
  }
  if (ruNew !== null) {
    const p = `${LOCALES}/ru/${file}`;
    try {
      const obj = JSON.parse(readFileSync(p, 'utf-8'));
      if (setByPath(obj, key, ruNew)) {
        writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
        console.log(`  RU ${file} ${key} → ${JSON.stringify(ruNew)}`);
        touched++;
      }
    } catch (e) { console.error(`RU ${file} ${key}: ${e.message}`); }
  }
}
console.log(`\nFixed ${touched} translation values.`);
