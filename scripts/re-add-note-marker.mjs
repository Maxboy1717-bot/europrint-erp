#!/usr/bin/env node
/** Re-add `NOTE:` marker (lost when a linter renamed it to RULE4_EXCEPTION). */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const DIR = resolve(ROOT, 'apps', 'api', 'src', 'modules', 'aisha', 'application', 'tools');

let changed = 0;
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.tool.ts'))) {
  const p = join(DIR, f);
  const src = readFileSync(p, 'utf-8');
  if (/NOTE:/.test(src)) continue;
  if (!/(db\.execute|runQuery)\(sql/.test(src)) continue;
  // Replace the linter-renamed marker
  const next = src.replace('// RULE4_EXCEPTION:', '// NOTE: (RULE4_EXCEPTION)');
  if (next === src) continue;
  writeFileSync(p, next, 'utf-8');
  changed++;
  console.log(`updated: ${f}`);
}
console.log(`\nchanged: ${changed}`);
