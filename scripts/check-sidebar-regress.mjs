#!/usr/bin/env node
/**
 * check-sidebar-regress.mjs — Guard: Ombor + POS Monitor sidebar regression lock.
 *
 * Problem it solves: the 2026-05-21 sidebar cleanup (tz08 Ombor + tz10 POS) was
 * REVERTED because nothing enforced it (same failure mode as the HR-pages regress).
 * Canonical structure (memory: session_2026-05-21_full_cleanup.md):
 *   - POS Monitor (`pos-monitor`) is the SINGLE canonical POS app. The old `/pos/*`
 *     cluster (dashboard, stock, movements, requests, barcode, inventory-counts,
 *     warehouse, sync, inventory, mini-app) duplicated it → removed.
 *   - The 9 warehouse-type subviews (warehouse/hub/RM-MAIN .. MRO-STORE) became a
 *     Tabs filter INSIDE Ombor Dashboard (`warehouse/hub`), NOT separate sidebar
 *     entries. The `/warehouse/hub/:code` route stays (deep-link), but no per-type
 *     sidebar row.
 *
 * This guard stops new sidebar code from re-introducing either, so the cleanup
 * cannot silently regress a second time.
 *
 * DIFF-AWARE: inspects only lines ADDED in the staged commit, so pre-existing
 * code never blocks — only NEW regressions do.
 *
 * Scope: artifacts/erp-dashboard/src/components/sidebar/constants*.ts
 *
 * BLOCK (exit 1):
 *   1. A new sidebar `url: "pos"` or `url: "pos/..."` entry.
 *      Canonical POS = the single `url: "pos-monitor"` — NOT matched (after "pos"
 *      comes "-", not "/" or a closing quote).
 *   2. A new sidebar `url: "warehouse/hub/<CODE>"` where CODE is a hyphenated
 *      warehouse-type code (RM-MAIN, FG-MAIN, QC-HOLD, MRO-STORE, ...).
 *      Canonical = `warehouse/hub` (dashboard) + in-page Tabs filter. The kept
 *      `warehouse/hub/SCRAP` (Chiqindilar) has no hyphen → NOT matched.
 *
 * Usage:
 *   node scripts/check-sidebar-regress.mjs            # pre-commit gate (staged diff)
 *   node scripts/check-sidebar-regress.mjs --verbose
 *
 * Bypass (only with a written reason): git commit --no-verify
 *
 * 2026-05-30 — Ombor + POS Monitor kanonik tuzilma regress-lock (Qoida 22).
 */
import { execSync } from 'node:child_process';

const verbose = process.argv.includes('--verbose');

// Only guard the sidebar constants files (where menu entries live).
const IN_SCOPE = /^artifacts\/erp-dashboard\/src\/components\/sidebar\/constants.*\.ts$/;

// Old /pos/* sidebar URL re-added. "pos-monitor" is allowed because after "pos"
// comes "-", not "/" or a closing quote.
const POS_REGRESS = /url:\s*["'`]pos(?:\/|["'`])/;

// A warehouse-type subview deep-link (RM-MAIN, FG-MAIN, QC-HOLD, MRO-STORE, ...).
// Hyphenated uppercase code → blocked. "warehouse/hub" (dashboard) and
// "warehouse/hub/SCRAP" (Chiqindilar, no hyphen) are NOT matched.
const WAREHOUSE_SUBVIEW = /url:\s*["'`]warehouse\/hub\/[A-Z0-9]+-[A-Z0-9]+/;

let diff;
try {
  diff = execSync('git diff --cached --unified=0 -- "*.ts"', { encoding: 'utf8' });
} catch {
  process.exit(0); // no git / nothing staged — skip
}

let file = '';
const blocks = [];
const scanned = new Set();

for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
  if (!IN_SCOPE.test(file)) continue;
  scanned.add(file);
  if (!line.startsWith('+') || line.startsWith('+++')) continue;

  const code = line.slice(1);
  if (POS_REGRESS.test(code)) {
    blocks.push({ file, kind: 'POS', code: code.trim().slice(0, 140) });
  } else if (WAREHOUSE_SUBVIEW.test(code)) {
    blocks.push({ file, kind: 'OMBOR', code: code.trim().slice(0, 140) });
  }
}

if (verbose) {
  console.error(`[check-sidebar-regress] scanned ${scanned.size} sidebar file(s): ${[...scanned].join(', ') || '(none)'}`);
}

if (blocks.length) {
  console.error('\n❌ Ombor/POS sidebar regress BLOK: 2026-05-21 kanon buzildi.\n');
  for (const b of blocks) {
    console.error(`   📄 ${b.file}  [${b.kind}]`);
    console.error(`      ${b.code}\n`);
  }
  console.error('💡 Kanon:');
  console.error('   POS    → faqat bitta { url: "pos-monitor" } (eski /pos/* = duplikat).');
  console.error('   Ombor  → 9 ombor-turi { url: "warehouse/hub" } ICHIDA Tabs filter;');
  console.error('            alohida warehouse/hub/RM-MAIN.. sidebar yozuv EMAS.');
  console.error('   Atayin bo\'lsa: git commit --no-verify (+ sabab).\n');
  process.exit(1);
}

console.log('✅ Ombor/POS sidebar: no regressed /pos/* or warehouse-type subview entries.');
process.exit(0);
