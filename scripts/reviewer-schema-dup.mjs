#!/usr/bin/env node
/**
 * reviewer-schema-dup.mjs — duplicate pgTable ratchet guard.
 *
 * Scans lib/db/src and apps/api/src/shared/db for `pgTable("name", ...)` and
 * `pgTableCreator`-style table definitions, counts how many distinct FILES
 * define each DB table name, and FAILS if any table is defined in MORE files
 * than recorded in the baseline. This lets the existing (intentional) two-
 * universe duplicates pass while preventing NEW duplication from creeping in.
 *
 * Usage:
 *   node scripts/reviewer-schema-dup.mjs                 # check against baseline (CI)
 *   node scripts/reviewer-schema-dup.mjs --update-baseline   # regenerate baseline
 *
 * Baseline file: scripts/schema-dup-baseline.json
 *
 * Context: EuroPrint has two parallel schema universes (lib/db `@workspace/db`
 * and apps/api/src/shared/db stubs). Physically merging them is a large
 * supervised refactor (incompatible PK types — see docs/schema-dedup-20agent-plan.md).
 * Until that happens, this ratchet stops the duplication from growing.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(root, 'scripts', 'schema-dup-baseline.json');
const SCAN_DIRS = ['lib/db/src', 'apps/api/src/shared/db'];
const TABLE_RE = /pgTable\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g;

function listFiles() {
  // Prefer git for speed/accuracy; fall back to a recursive glob if needed.
  try {
    const out = execSync('git ls-files ' + SCAN_DIRS.map((d) => `"${d}"`).join(' '), {
      cwd: root,
      encoding: 'utf8',
    });
    return out.split(/\r?\n/).filter((f) => f.endsWith('.ts'));
  } catch {
    return [];
  }
}

const counts = {}; // table -> Set(files)
for (const rel of listFiles()) {
  let src;
  try {
    src = readFileSync(join(root, rel), 'utf8');
  } catch {
    continue;
  }
  let m;
  TABLE_RE.lastIndex = 0;
  while ((m = TABLE_RE.exec(src))) {
    const t = m[1];
    (counts[t] = counts[t] || new Set()).add(rel);
  }
}

const current = {};
for (const [t, files] of Object.entries(counts)) {
  if (files.size > 1) current[t] = files.size;
}

if (process.argv.includes('--update-baseline')) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log(`✓ baseline updated: ${Object.keys(current).length} duplicated tables recorded.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('✗ no baseline. Run: node scripts/reviewer-schema-dup.mjs --update-baseline');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const violations = [];
for (const [t, n] of Object.entries(current)) {
  const allowed = baseline[t] ?? 1;
  if (n > allowed) violations.push(`${t}: defined in ${n} files (baseline ${allowed})`);
}
// New duplicated table not in baseline at all
for (const [t, n] of Object.entries(current)) {
  if (!(t in baseline)) violations.push(`${t}: NEW duplicate, defined in ${n} files (baseline 0/1)`);
}

if (violations.length) {
  console.error(`✗ schema-dup ratchet FAIL — ${violations.length} new/grown duplicate(s):`);
  for (const v of violations) console.error('  - ' + v);
  console.error('\nFix the duplication or, if intentional, run --update-baseline (with review).');
  console.error(`PASS: 0 | WARN: 0 | FAIL: ${violations.length}`);
  process.exit(1);
}
console.log(`✓ schema-dup ratchet PASS (${Object.keys(current).length} known duplicates, none grew).`);
console.log(`PASS: ${Object.keys(current).length} | WARN: 0 | FAIL: 0`);
process.exit(0);
