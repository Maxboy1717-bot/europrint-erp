#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
const uzP = 'artifacts/erp-dashboard/src/locales/uz/navigation.json';
const ruP = 'artifacts/erp-dashboard/src/locales/ru/navigation.json';
const uz = JSON.parse(readFileSync(uzP, 'utf-8'));
const ru = JSON.parse(readFileSync(ruP, 'utf-8'));
const adds = {
  'Kamera Sifat Nazorati': { uz: 'Kamera sifat nazorati', ru: 'Камера контроля качества' },
};
for (const [k, v] of Object.entries(adds)) {
  if (!(k in uz)) { uz[k] = v.uz; console.log(`UZ + ${k}`); }
  if (!(k in ru)) { ru[k] = v.ru; console.log(`RU + ${k}`); }
}
writeFileSync(uzP, JSON.stringify(uz, null, 2) + '\n');
writeFileSync(ruP, JSON.stringify(ru, null, 2) + '\n');
