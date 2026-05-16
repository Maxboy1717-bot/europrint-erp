#!/usr/bin/env node
/** Detect duplicate HTTP method+path declarations across all controllers. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'apps/api/src';

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && /\.controller\.ts$/.test(e.name) && !/\.spec\.|\.test\./.test(e.name)) {
      yield full;
    }
  }
}

const routes = new Map(); // "METHOD /api/path" → [files…]

for (const f of walk(ROOT)) {
  const src = readFileSync(f, 'utf-8');

  // Find @Controller declarations + their start positions
  const ctrlRe = /@Controller\s*\(\s*(?:\[\s*['"]([^'"]+)['"]|['"]([^'"]*)['"]|\{\s*path:\s*['"]([^'"]*)['"]|\s*\))/g;
  const ctrlPositions = [];
  let cm;
  while ((cm = ctrlRe.exec(src))) {
    const prefix = (cm[1] ?? cm[2] ?? cm[3] ?? '').replace(/^\//, '').replace(/\/$/, '');
    ctrlPositions.push({ start: cm.index, prefix });
  }
  if (ctrlPositions.length === 0) continue;

  for (let i = 0; i < ctrlPositions.length; i++) {
    const { start, prefix } = ctrlPositions[i];
    const end = i + 1 < ctrlPositions.length ? ctrlPositions[i + 1].start : src.length;
    const block = src.slice(start, end);

    const methodRe = /@(Get|Post|Put|Patch|Delete)\(\s*([^)]*?)\s*\)/g;
    let m;
    while ((m = methodRe.exec(block))) {
      const method = m[1].toUpperCase();
      const args = m[2] ?? '';
      const strRe = /['"]([^'"]*)['"]/g;
      let sm;
      const subPaths = [];
      while ((sm = strRe.exec(args))) subPaths.push(sm[1]);
      if (subPaths.length === 0) subPaths.push('');
      for (const sp of subPaths) {
        const url = `/api/${prefix}${sp ? '/' + sp.replace(/^\//, '') : ''}`.replace(/\/+/g, '/');
        // Normalize :param to :id to detect param-pattern collisions
        const key = `${method} ${url}`;
        const arr = routes.get(key) || [];
        arr.push(f);
        routes.set(key, arr);
      }
    }
  }
}

const dups = [...routes.entries()].filter(([, arr]) => arr.length > 1);

console.log(`Total unique method+path: ${routes.size}`);
console.log(`Duplicate routes: ${dups.length}`);
console.log();
for (const [key, files] of dups) {
  console.log(`✗ ${key}`);
  for (const f of files) console.log(`     ${f}`);
}
