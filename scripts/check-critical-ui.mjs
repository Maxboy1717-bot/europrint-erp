#!/usr/bin/env node
/**
 * check-critical-ui.mjs — Guard 1: Critical UI Invariant Check
 *
 * Ensures key UI components and exports cannot be silently removed by a
 * design sprint or refactor commit without a build gate catching it.
 *
 * Problem it solves: Session 7/8 saw ModuleTabs accidentally removed from
 * AppShellModern.tsx during a design sprint commit — no guard caught it,
 * and module navigation broke silently for all users.
 *
 * Usage:
 *   node scripts/check-critical-ui.mjs            # pre-commit (blocks on failure)
 *   node scripts/check-critical-ui.mjs --verbose  # show each check result
 *
 * Session 9 — EuroPrint ERP governance.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------
// Invariants — edit with care; each removal is a deliberate decision.
// ---------------------------------------------------------------------------
const CRITICAL_UI_INVARIANTS = [
  {
    file: 'artifacts/erp-dashboard/src/erp-modern-ui/AppShellModern.tsx',
    mustContain: ['ModuleTabs'],
    reason: 'ModuleTabs header da bo\'lmasa modul navigation ishlamaydi (HR↔Sales↔WMS↔Finance)',
  },
  {
    file: 'artifacts/erp-dashboard/src/components/ModuleSidebar.tsx',
    mustContain: [
      'export { MobileSidebar }',
      'export { ModuleTabs }',
      'export { findModuleByPath }',
    ],
    reason: 'ModuleSidebar.tsx dan muhim re-exportlar o\'chirilmasin',
  },
  {
    file: 'artifacts/erp-dashboard/src/App.tsx',
    mustContain: ['AppShellModern'],
    reason: 'App.tsx da authenticated shell almashtirilmasin',
  },
  {
    file: 'artifacts/erp-dashboard/src/components/ep/index.ts',
    mustContain: ['EPErrorState', 'EPComingSoon', 'EPEmptyState', 'EPPageHeader'],
    reason: 'EP komponentlar barrel exportdan o\'chirilmasin',
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
let failures = 0;
const results = [];

for (const invariant of CRITICAL_UI_INVARIANTS) {
  const abs = resolve(root, invariant.file);

  if (!existsSync(abs)) {
    results.push({ ok: false, file: invariant.file, detail: 'FILE NOT FOUND', reason: invariant.reason });
    failures++;
    continue;
  }

  const src = readFileSync(abs, 'utf8');
  const missing = invariant.mustContain.filter((s) => !src.includes(s));

  if (missing.length) {
    results.push({
      ok: false,
      file: invariant.file,
      detail: `Missing: ${missing.map((s) => `"${s}"`).join(', ')}`,
      reason: invariant.reason,
    });
    failures++;
  } else {
    results.push({ ok: true, file: invariant.file });
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
if (verbose || failures > 0) {
  for (const r of results) {
    if (r.ok) {
      if (verbose) console.log(`  ✅ ${r.file}`);
    } else {
      console.error(`  ❌ ${r.file}`);
      console.error(`     ${r.detail}`);
      console.error(`     Why: ${r.reason}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n❌ Critical UI invariants: ${failures} FAIL — commit blocked.`);
  console.error('   Restore the missing exports/usages or update this guard intentionally.');
  process.exit(1);
}

console.log(`✅ Critical UI invariants: PASS (${CRITICAL_UI_INVARIANTS.length} checks)`);
process.exit(0);
