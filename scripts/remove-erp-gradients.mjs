#!/usr/bin/env node
/**
 * @module remove-erp-gradients
 * @description The EuroPrint design system explicitly forbids gradients in
 *   the ERP shell (§3.7) — marketing-only. This script replaces common
 *   `bg-gradient-to-X from-Y to-Z` Tailwind patterns with flat tokens.
 *
 *   Replacement rules (Tailwind classNames inside JSX):
 *
 *     bg-gradient-to-br from-primary to-primary-dim   → bg-primary
 *     bg-gradient-to-r from-primary to-primary-dim    → bg-primary
 *     bg-gradient-to-br from-orange-500 to-amber-500  → bg-primary
 *     bg-gradient-to-br from-orange-500 to-red-500    → bg-primary
 *     bg-gradient-to-br from-emerald-500 to-teal-500  → bg-emerald-500
 *     bg-gradient-to-br from-sky-500 to-blue-500      → bg-blue-500
 *     bg-gradient-to-br from-amber-500 to-orange-500  → bg-amber-500
 *     bg-gradient-to-br from-violet-500 to-purple-500 → bg-purple-500
 *     bg-gradient-to-br from-slate-500 to-slate-600   → bg-slate-500
 *     ... and other obvious 2-color same-family pairs.
 *
 *   Plus: drop `shadow-md shadow-<color>-500/20` brand-tinted shadows that
 *   pair with the gradient (they look wrong on the flat color).
 *
 *   Skip:
 *     - artifacts/europrint-site/ (marketing — gradients allowed)
 *     - any file under preview/ or europrint-site/
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "europrint-site" || entry === "preview" || entry === "node_modules") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

// Map each common 2-color gradient to a single flat color class.
// Greedy: handles `bg-gradient-to-X from-A-N to-B-N` with optional direction.
const GRADIENT_REPLACEMENTS = [
  // Brand orange family
  [/bg-gradient-to-\w+\s+from-primary(?:-dim)?\s+to-primary(?:-dim)?/g, "bg-primary"],
  [/bg-gradient-to-\w+\s+from-orange-\d+\s+to-amber-\d+/g, "bg-primary"],
  [/bg-gradient-to-\w+\s+from-amber-\d+\s+to-orange-\d+/g, "bg-primary"],
  [/bg-gradient-to-\w+\s+from-orange-\d+\s+to-red-\d+/g, "bg-primary"],
  [/bg-gradient-to-\w+\s+from-orange-\d+\s+to-orange-\d+/g, "bg-primary"],
  // Green family
  [/bg-gradient-to-\w+\s+from-emerald-\d+\s+to-teal-\d+/g, "bg-emerald-500"],
  [/bg-gradient-to-\w+\s+from-green-\d+\s+to-emerald-\d+/g, "bg-green-500"],
  [/bg-gradient-to-\w+\s+from-emerald-\d+\s+to-green-\d+/g, "bg-emerald-500"],
  // Blue family
  [/bg-gradient-to-\w+\s+from-sky-\d+\s+to-blue-\d+/g, "bg-blue-500"],
  [/bg-gradient-to-\w+\s+from-blue-\d+\s+to-blue-\d+/g, "bg-blue-500"],
  [/bg-gradient-to-\w+\s+from-blue-\d+\s+to-indigo-\d+/g, "bg-blue-500"],
  [/bg-gradient-to-\w+\s+from-indigo-\d+\s+to-purple-\d+/g, "bg-indigo-500"],
  // Purple family
  [/bg-gradient-to-\w+\s+from-violet-\d+\s+to-purple-\d+/g, "bg-purple-500"],
  [/bg-gradient-to-\w+\s+from-purple-\d+\s+to-pink-\d+/g, "bg-purple-500"],
  // Slate/gray
  [/bg-gradient-to-\w+\s+from-slate-\d+\s+to-slate-\d+/g, "bg-slate-500"],
  [/bg-gradient-to-\w+\s+from-gray-\d+\s+to-gray-\d+/g, "bg-slate-500"],
  // Yellow / amber
  [/bg-gradient-to-\w+\s+from-yellow-\d+\s+to-amber-\d+/g, "bg-amber-500"],
  // Red / rose
  [/bg-gradient-to-\w+\s+from-red-\d+\s+to-rose-\d+/g, "bg-red-500"],
  [/bg-gradient-to-\w+\s+from-red-\d+\s+to-red-\d+/g, "bg-red-500"],

  // Single-family same-color gradients (e.g. from-green-600 to-green-700) — catch-all.
  // Run AFTER the more specific rules above so they win when both could match.
  [/bg-gradient-to-\w+\s+from-green-\d+\s+to-green-\d+/g, "bg-green-500"],
  [/bg-gradient-to-\w+\s+from-emerald-\d+\s+to-emerald-\d+/g, "bg-emerald-500"],
  [/bg-gradient-to-\w+\s+from-purple-\d+\s+to-purple-\d+/g, "bg-purple-500"],
  [/bg-gradient-to-\w+\s+from-violet-\d+\s+to-violet-\d+/g, "bg-purple-500"],
  [/bg-gradient-to-\w+\s+from-pink-\d+\s+to-pink-\d+/g, "bg-pink-500"],
  [/bg-gradient-to-\w+\s+from-amber-\d+\s+to-amber-\d+/g, "bg-amber-500"],
  [/bg-gradient-to-\w+\s+from-yellow-\d+\s+to-yellow-\d+/g, "bg-yellow-500"],
  [/bg-gradient-to-\w+\s+from-cyan-\d+\s+to-cyan-\d+/g, "bg-cyan-500"],
  [/bg-gradient-to-\w+\s+from-teal-\d+\s+to-teal-\d+/g, "bg-teal-500"],
  [/bg-gradient-to-\w+\s+from-rose-\d+\s+to-rose-\d+/g, "bg-rose-500"],

  // Dynamic gradients inside template literals — the `from-X to-Y` portion
  // appears bare (without leading `bg-gradient-to-X`). Drop it so the
  // surrounding `${flag ? "from-A to-B" : "from-C to-D"}` becomes a no-op.
  // (Falls back to the `bg-gradient-to-br` token that was preserved nearby.)
  [/from-(?:emerald|green|amber|orange|red|rose|blue|sky|indigo|violet|purple|pink|cyan|teal|slate|gray|zinc|stone|yellow)-\d+\s+to-(?:emerald|green|amber|orange|red|rose|blue|sky|indigo|violet|purple|pink|cyan|teal|slate|gray|zinc|stone|yellow)-\d+/g, ""],
  // Now strip leftover `bg-gradient-to-X` with no `from-` after (which becomes
  // a no-op class).
  [/\bbg-gradient-to-\w+\s+/g, ""],
];

// Drop brand-tinted box-shadow utilities like `shadow-md shadow-orange-500/20`
// (only the colored shadow part — the `shadow-md` itself stays).
const SHADOW_TINT_RE = /\s+shadow-\w+-\d+\/\d+/g;

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  for (const [re, replacement] of GRADIENT_REPLACEMENTS) {
    src = src.replace(re, replacement);
  }
  src = src.replace(SHADOW_TINT_RE, "");

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No ERP-shell gradients left.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s).`);
for (const f of fixed.slice(0, 10)) console.log(`  ${f}`);
if (fixed.length > 10) console.log(`  ... and ${fixed.length - 10} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
