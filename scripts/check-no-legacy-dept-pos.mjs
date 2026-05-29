#!/usr/bin/env node
/**
 * check-no-legacy-dept-pos.mjs — Guard: legacy department/position regression lock.
 *
 * Problem it solves: the legacy `departments` / `positions` tables + their
 * `/api/departments` and `/api/positions` HTTP endpoints duplicated the
 * org-schema (`org_departments` + `org_functions`). All FE consumers were
 * migrated to `/api/org-departments` (departments) and `/api/org-functions`
 * (positions/Lavozim). This guard stops new FE code from re-introducing the
 * legacy endpoints — otherwise the duplication creeps back.
 *
 * DIFF-AWARE: inspects only lines ADDED in the staged commit, so pre-existing
 * code never blocks — only NEW legacy usage does.
 *
 * BLOCK (exit 1): a NEW string literal "/api/departments" or "/api/positions"
 *   (optionally with /:id) in dashboard FE source. Use the org-schema instead:
 *     /api/departments  → /api/org-departments   (org_departments)
 *     /api/positions    → /api/org-functions      (org_functions = Lavozim)
 *
 * NOT matched (legitimate, share the "/api/...departments" substring):
 *   /api/org-departments, /api/core/departments, /api/org-functions — the regex
 *   anchors on "/api/" immediately followed by "departments"/"positions".
 *
 * Allowlisted files: tests (mock fixtures may reference legacy shapes).
 *
 * Usage:
 *   node scripts/check-no-legacy-dept-pos.mjs            # pre-commit gate (staged diff)
 *   node scripts/check-no-legacy-dept-pos.mjs --verbose
 *
 * Bypass (only with a written reason): git commit --no-verify
 *
 * 2026-05-29 — legacy Lavozim/Bo'lim → org-schema migration governance.
 */
import { execSync } from 'node:child_process';

const verbose = process.argv.includes('--verbose');

// Only guard the dashboard FE source.
const IN_SCOPE = /^artifacts\/erp-dashboard\/src\//;

// Files that legitimately keep legacy references (test mocks) → never flagged.
const ALLOW = [/\.(spec|test)\.(ts|tsx)$/];

// BLOCK: a string literal for the LEGACY endpoint. The char class before /api/
// ensures it is a quoted URL; "departments"/"positions" must come right after
// "/api/" so /api/org-departments, /api/core/departments, /api/org-functions
// are NOT matched.
const LEGACY_ENDPOINT = /["'`]\/api\/(?:departments|positions)\b/;

let diff;
try {
  diff = execSync('git diff --cached --unified=0 -- "*.tsx" "*.ts"', { encoding: 'utf8' });
} catch {
  process.exit(0); // no git / nothing staged — skip
}

let file = '';
const blocks = [];

for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
  if (!IN_SCOPE.test(file) || ALLOW.some((re) => re.test(file))) continue;
  if (!line.startsWith('+') || line.startsWith('+++')) continue;

  const code = line.slice(1);
  if (LEGACY_ENDPOINT.test(code)) {
    blocks.push({ file, code: code.trim().slice(0, 140) });
  }
}

if (blocks.length) {
  console.error('\n❌ Legacy dept/pos regress BLOK: yangi kod legacy endpoint ishlatdi.\n');
  for (const b of blocks) {
    console.error(`   📄 ${b.file}`);
    console.error(`      ${b.code}\n`);
  }
  console.error('💡 Yechim — org-sxema endpointlaridan foydalaning:');
  console.error('   "/api/departments"  →  "/api/org-departments"   (org_departments)');
  console.error('   "/api/positions"    →  "/api/org-functions"      (org_functions = Lavozim)');
  console.error('   Atayin bo\'lsa: git commit --no-verify (+ sabab).\n');
  process.exit(1);
}

console.log('✅ Legacy dept/pos: no new /api/departments or /api/positions usage.');
process.exit(0);
