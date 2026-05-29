#!/usr/bin/env node
/**
 * check-design-tokens.mjs — Guard: EuroPrint design-system regression lock.
 *
 * Problem it solves: the design system (tokens in src/erp-modern-ui/*.css +
 * EP* components + the 5 universal page templates) keeps "disappearing" because
 * new code re-introduces hardcoded colors / inline pixel styling instead of the
 * tokens. There was NO guard preventing that regression — so it always crept back.
 *
 * This guard is DIFF-AWARE: it only inspects lines ADDED in the staged commit,
 * so the ~950 pre-existing violations never block a commit — only NEW regressions do.
 *
 * Severity (graduated, to avoid blindsiding concurrent agents on the shared branch):
 *   - BLOCK (exit 1): a raw #hex / rgb()/rgba()/hsl() literal INSIDE an inline
 *     `style={{ ... }}` — this is essentially never legitimate here and is rare in
 *     new code. Use a token: var(--ep-*) / var(--mod-*) or a Tailwind semantic class.
 *   - WARN (non-blocking): a Tailwind arbitrary hex value like `text-[#94a3b8]`.
 *     Softer signal; surfaced but not blocked yet (escalate to BLOCK after FAZA 2).
 *
 * Allowlisted (these legitimately own raw colors):
 *   src/erp-modern-ui/** (token + theme CSS layer), components/ep/** (the design
 *   components themselves), chart components (data-viz palettes), *.css, tests.
 *
 * Usage:
 *   node scripts/check-design-tokens.mjs            # pre-commit gate (staged diff)
 *   node scripts/check-design-tokens.mjs --verbose  # also print WARN details
 *
 * Bypass (only with a written reason): git commit --no-verify
 *
 * 2026-05-29 — EuroPrint design-system migration governance (FAZA 3).
 */
import { execSync } from 'node:child_process';

const verbose = process.argv.includes('--verbose');

// Files that legitimately define/handle raw colors → never flagged.
const ALLOW = [
  /\/erp-modern-ui\//,
  /\/components\/ep\//,
  /\/components\/ui\/chart/,
  /chart[^/]*\.(ts|tsx)$/i,
  /\.css$/,
  /\.(spec|test)\.(ts|tsx)$/,
];

// Only guard the dashboard FE source.
const IN_SCOPE = /^artifacts\/erp-dashboard\/src\//;

// BLOCK: hex or rgb/hsl literal inside an inline style object on one line.
const HEX_IN_STYLE = /style=\{\{[^}]*#[0-9a-fA-F]{3,8}\b/;
const FN_IN_STYLE  = /style=\{\{[^}]*(?:rgba?|hsla?)\s*\(/;
// WARN: Tailwind arbitrary hex value, e.g. text-[#94a3b8], bg-[#fff].
const TW_ARB_HEX   = /\b(?:text|bg|border|fill|stroke|ring|from|to|via|decoration|outline|shadow|caret|accent|divide|placeholder)-\[#[0-9a-fA-F]{3,8}\]/;

let diff;
try {
  diff = execSync('git diff --cached --unified=0 -- "*.tsx" "*.ts"', { encoding: 'utf8' });
} catch {
  process.exit(0); // no git / nothing staged — skip
}

let file = '';
const blocks = [];
const warns = [];

for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
  if (!IN_SCOPE.test(file) || ALLOW.some((re) => re.test(file))) continue;
  if (!line.startsWith('+') || line.startsWith('+++')) continue;

  const code = line.slice(1);
  if (HEX_IN_STYLE.test(code) || FN_IN_STYLE.test(code)) {
    blocks.push({ file, code: code.trim().slice(0, 140) });
  } else if (TW_ARB_HEX.test(code)) {
    warns.push({ file, code: code.trim().slice(0, 140) });
  }
}

if (warns.length) {
  console.log(`\n⚠️  Design tokens (WARN, non-blocking): ${warns.length} ta Tailwind arbitrary hex ([#...]).`);
  if (verbose) {
    for (const w of warns) console.log(`   📄 ${w.file}\n      ${w.code}`);
  }
  console.log('   Tavsiya: var(--ep-*)/var(--mod-*) token yoki semantic Tailwind class ishlating.');
}

if (blocks.length) {
  console.error('\n❌ Dizayn-tizim regress BLOK: inline style ichida hardcoded rang qo\'shildi.\n');
  for (const b of blocks) {
    console.error(`   📄 ${b.file}`);
    console.error(`      ${b.code}\n`);
  }
  console.error('💡 Yechim: inline style ichidagi #hex / rgb() o\'rniga token ishlating:');
  console.error('   style={{ color: "var(--ep-text)" }} yoki className="text-[var(--ep-primary)]".');
  console.error('   Token/EP/chart fayllari allowlistda. Atayin bo\'lsa: git commit --no-verify (+sabab).\n');
  process.exit(1);
}

console.log('✅ Design tokens: no new inline hardcoded colors.');
process.exit(0);
