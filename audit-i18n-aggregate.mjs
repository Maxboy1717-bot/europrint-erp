#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const hardcoded = JSON.parse(readFileSync('audit-hardcoded-report.json', 'utf-8'));
const eng = JSON.parse(readFileSync('audit-i18n-strict-report.json', 'utf-8'));

const byDir = {};
for (const f of hardcoded) {
  const norm = f.file.replace(/\\/g, '/');
  const dir = norm.split('/').slice(0, 2).join('/') || norm.split('/')[0];
  byDir[dir] = (byDir[dir] || 0) + f.count;
}

console.log('=== Hardcoded JSX strings per top dir ===');
for (const [d, c] of Object.entries(byDir).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log('  ' + d.padEnd(50) + c);
}
console.log();

let uzCount = 0;
let ruCount = 0;
for (const ns of Object.values(eng.uz)) uzCount += ns.length;
for (const ns of Object.values(eng.ru)) ruCount += ns.length;

console.log('=== Locale English-leak counts (strict detector) ===');
console.log('  UZ English-flagged:', uzCount);
console.log('  RU English-flagged:', ruCount);
console.log();
console.log('=== UZ English-leak per namespace (top 10) ===');
for (const [ns, items] of Object.entries(eng.uz).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
  console.log('  ' + ns.padEnd(15) + items.length);
}
