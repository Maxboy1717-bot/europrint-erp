#!/usr/bin/env node
/** Extract every `title: "..."` from sidebar/constants-*.ts and compare with navigation.json */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SIDEBAR = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'components', 'sidebar');
const LOCALES = resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');

const files = readdirSync(SIDEBAR).filter((f) => f.startsWith('constants-') && f.endsWith('.ts') && !f.includes('colors') && !f.includes('utils'));

const titles = new Set();
for (const f of files) {
  const src = readFileSync(join(SIDEBAR, f), 'utf-8');
  for (const m of src.matchAll(/title:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)) titles.add(m[1]);
  for (const m of src.matchAll(/title:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g)) titles.add(m[1]);
}

const uz = JSON.parse(readFileSync(join(LOCALES, 'uz', 'navigation.json'), 'utf-8'));
const ru = JSON.parse(readFileSync(join(LOCALES, 'ru', 'navigation.json'), 'utf-8'));

const missingUz = [];
const missingRu = [];
for (const t of titles) {
  if (!(t in uz)) missingUz.push(t);
  if (!(t in ru)) missingRu.push(t);
}

console.log(`Total unique titles in constants-*.ts: ${titles.size}`);
console.log(`Missing in uz/navigation.json: ${missingUz.length}`);
console.log(`Missing in ru/navigation.json: ${missingRu.length}`);
if (missingUz.length || missingRu.length) {
  console.log('--- missing uz ---');
  for (const k of missingUz.sort()) console.log(k);
  console.log('--- missing ru ---');
  for (const k of missingRu.sort()) console.log(k);
}

writeFileSync(join(ROOT, 'scripts', 'nav-missing.json'), JSON.stringify({ allTitles: [...titles].sort(), missingUz: missingUz.sort(), missingRu: missingRu.sort() }, null, 2));
