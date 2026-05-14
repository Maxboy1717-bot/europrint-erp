#!/usr/bin/env node
/**
 * @module migrate-material-you-tokens
 * @description The ERP dashboard's old theme layer used Material You class
 *   names (Bitrix24-flavoured): `bg-surface-container-lowest`, `text-on-surface`,
 *   `border-outline-variant`, `bg-primary-container`, etc. The new EP theme
 *   ("EP Linear Soft") routes everything through shadcn semantic tokens —
 *   `bg-card`, `text-foreground`, `border-border`, `bg-primary/10`.
 *
 *   This script replaces every Material You class with its shadcn equivalent
 *   so all pages render in the same colour vocabulary.
 *
 *   Replacements (longest first — order matters so "bg-surface-container-lowest"
 *   doesn't get partially eaten by a "bg-surface-container" rule):
 *
 *   Surfaces:
 *     bg-surface-container-lowest      → bg-card
 *     bg-surface-container-low         → bg-muted/40
 *     bg-surface-container-high        → bg-muted
 *     bg-surface-container-highest     → bg-muted
 *     bg-surface-container             → bg-muted/60
 *     bg-surface                       → bg-background
 *
 *   Foreground text:
 *     text-on-surface-variant          → text-muted-foreground
 *     text-on-surface                  → text-foreground
 *     text-on-primary-container        → text-primary
 *     text-on-primary                  → text-primary-foreground
 *
 *   Borders:
 *     border-outline-variant           → border-border
 *     border-outline                   → border-border
 *
 *   Primary container (soft brand tint):
 *     bg-primary-container             → bg-primary/10
 *     bg-secondary-container           → bg-secondary
 *
 *   Status / error:
 *     text-error                       → text-[var(--ep-red)]
 *     bg-error                         → bg-[var(--ep-red)]
 *
 *   Compound utilities (when the legacy was hyphenated mid-class):
 *     hover:bg-surface-container-high  → hover:bg-muted
 *     hover:bg-surface-container       → hover:bg-muted
 *     focus:bg-surface-container-high  → focus:bg-muted
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (
      entry === "europrint-site" ||
      entry === "node_modules" ||
      entry === "dist" ||
      entry === "erp-modern-ui"
    ) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

// IMPORTANT: longest-prefix-first ordering. Otherwise `bg-surface-container`
// would match before `bg-surface-container-lowest` and corrupt the longer one.
const REPLACEMENTS = [
  // Surfaces (most-specific first)
  ["bg-surface-container-lowest",         "bg-card"],
  ["bg-surface-container-highest",        "bg-muted"],
  ["bg-surface-container-high",           "bg-muted"],
  ["bg-surface-container-low",            "bg-muted/40"],
  ["bg-surface-container",                "bg-muted/60"],
  ["bg-surface",                          "bg-background"],
  // Hover/focus variants of surfaces
  ["hover:bg-surface-container-highest",  "hover:bg-muted"],
  ["hover:bg-surface-container-high",     "hover:bg-muted"],
  ["hover:bg-surface-container-low",      "hover:bg-muted/60"],
  ["hover:bg-surface-container",          "hover:bg-muted"],
  ["focus:bg-surface-container-high",     "focus:bg-muted"],
  // Foreground text
  ["text-on-surface-variant",             "text-muted-foreground"],
  ["text-on-surface",                     "text-foreground"],
  ["text-on-primary-container",           "text-primary"],
  ["text-on-primary",                     "text-primary-foreground"],
  ["text-on-secondary-container",         "text-secondary-foreground"],
  ["text-on-error-container",             "text-[var(--ep-red)]"],
  // Borders
  ["border-outline-variant",              "border-border"],
  ["border-outline",                      "border-border"],
  // Primary/secondary containers
  ["bg-primary-container",                "bg-primary/10"],
  ["bg-secondary-container",              "bg-secondary"],
  ["bg-error-container",                  "bg-[var(--ep-red)]/10"],
  // Status text
  ["text-error",                          "text-[var(--ep-red)]"],
  ["bg-error",                            "bg-[var(--ep-red)]"],
];

const fixed = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let count = 0;

  for (const [from, to] of REPLACEMENTS) {
    // Word-boundary aware: only replace if the class is bounded by whitespace,
    // quote, or the slash that marks a Tailwind opacity modifier (/N).
    // Negative lookbehind/ahead for word chars and hyphens prevents partial
    // matches like accidentally rewriting `bg-surface-container-lowest` to
    // `bg-card-lowest`.
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "g");
    src = src.replace(re, () => {
      count++;
      return to;
    });
  }

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count });
    totalReplacements += count;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No Material You tokens remaining.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Replaced" : "📋 Would replace"} ${totalReplacements} class(es) in ${fixed.length} file(s).\n`);
const top = fixed.slice().sort((a, b) => b.count - a.count).slice(0, 15);
for (const f of top) console.log(`  ${f.count}× ${f.file}`);
if (fixed.length > 15) console.log(`  ... and ${fixed.length - 15} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
