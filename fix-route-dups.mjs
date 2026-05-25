#!/usr/bin/env node
/**
 * fix-route-dups.mjs — neutralise duplicate route declarations in
 * compat / legacy / remaining controllers so the main controller wins.
 *
 * Strategy: rename the @Controller prefix on the legacy file to a unique
 * legacy alias (e.g. 'adaptation' → 'legacy/adaptation'). All its routes
 * then live under a non-conflicting path that no frontend calls. The
 * legacy controller stays in the module (no DI surprises) but its routes
 * are out of the way of the main controllers.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const REWRITES = [
  // [file, oldPrefix, newPrefix]
  ['apps/api/src/modules/compatibility/adaptation-compat.controller.ts', 'adaptation',        'legacy/adaptation'],
  ['apps/api/src/modules/remaining/fi.controller.ts',                    'fi',                'legacy/fi'],
  ['apps/api/src/modules/pos/pos.controller.ts',                         'pos',               'legacy/pos'],
];

let changed = 0;
for (const [f, oldP, newP] of REWRITES) {
  let src;
  try { src = readFileSync(f, 'utf-8'); } catch { console.log(`  skip (not found): ${f}`); continue; }
  const before = src;
  // Be precise: only rewrite @Controller('<oldP>') exactly, not other strings
  src = src.replace(new RegExp(`@Controller\\(['"]${oldP}['"]\\)`), `@Controller('${newP}')`);
  if (src !== before) {
    writeFileSync(f, src);
    console.log(`  ${f}: @Controller('${oldP}') → @Controller('${newP}')`);
    changed++;
  } else {
    console.log(`  ${f}: no @Controller('${oldP}') found`);
  }
}

console.log(`\nRewrote ${changed} controllers.`);
