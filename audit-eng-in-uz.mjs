#!/usr/bin/env node
/** Quick sampler: list which keys in a UZ namespace have English-looking values. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'artifacts/erp-dashboard/src/locales/uz';

function flatten(o, p = '') {
  const out = {};
  for (const [k, v] of Object.entries(o ?? {})) {
    const kk = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, kk));
    else out[kk] = v;
  }
  return out;
}

function looksEnglish(v) {
  if (typeof v !== 'string') return false;
  if (v.trim().length === 0 || v.length < 4) return false;
  if (/[Ѐ-ӿ]/.test(v)) return false;
  if (/[oO]['`]z|sh|gʻ|qish|chiq|kerak|yangi|tahrir/i.test(v)) return false;
  if (/^[A-Za-z][\w\s'.,\-:?!()/&]+$/.test(v)) {
    if (/\b(the|and|or|of|for|with|new|edit|create|delete|please|enter|select|loading|error|success|cancel|save|continue|details|name|email|password|search)\b/i.test(v)) return true;
    if (v.split(/\s+/).length >= 2) return true;
  }
  return false;
}

const target = process.argv[2] ?? 'common';
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));

if (target === 'all') {
  for (const f of files) {
    const ns = f.replace(/\.json$/, '');
    const obj = JSON.parse(readFileSync(join(DIR, f), 'utf-8'));
    const bad = Object.entries(flatten(obj)).filter(([, v]) => looksEnglish(v));
    if (bad.length > 0) console.log(`${ns.padEnd(15)} ${bad.length}`);
  }
} else {
  const path = join(DIR, `${target}.json`);
  const obj = JSON.parse(readFileSync(path, 'utf-8'));
  const bad = Object.entries(flatten(obj)).filter(([, v]) => looksEnglish(v));
  console.log(`Namespace: ${target}`);
  console.log(`English-flagged count: ${bad.length}`);
  console.log('--- First 50 ---');
  for (const [k, v] of bad.slice(0, 50)) console.log(`  ${k.padEnd(50)} = ${JSON.stringify(v)}`);
}
