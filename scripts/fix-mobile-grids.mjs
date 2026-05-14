#!/usr/bin/env node
/**
 * @module fix-mobile-grids
 * @description Add responsive prefixes to hard-coded `grid-cols-N` classes
 *   so the dashboard reflows on mobile instead of squishing 5 columns into
 *   a 360px screen.
 *
 *   Rules:
 *
 *     grid-cols-2         → grid-cols-1 sm:grid-cols-2
 *     grid-cols-3         → grid-cols-1 md:grid-cols-3
 *     grid-cols-4         → grid-cols-2 lg:grid-cols-4
 *     grid-cols-5         → grid-cols-2 lg:grid-cols-5
 *     grid-cols-6         → grid-cols-2 lg:grid-cols-6
 *
 *   We do NOT touch:
 *     - lines that already have `md:`/`lg:`/`sm:`/`xl:` prefixes on `grid-cols-N`
 *     - `grid-cols-1` (already correct)
 *     - arbitrary-value `grid-cols-[Npx]` (custom layouts)
 *
 *   Skip the public-site folder (different responsive contract).
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "europrint-site" || entry === "node_modules" || entry === "dist") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

// Each rule: the regex must match a `grid-cols-N` token that is NOT preceded
// by a `md:` / `lg:` / `sm:` / `xl:` / `2xl:` / `xs:` prefix, and is bounded
// by whitespace/quote/end on both sides.

const RESPONSIVE_RULES = [
  // grid-cols-2 → grid-cols-1 sm:grid-cols-2
  {
    re: /(?<![\w:-])(grid-cols-2)(?![\w-])/g,
    replacement: "grid-cols-1 sm:grid-cols-2",
  },
  // grid-cols-3 → grid-cols-1 md:grid-cols-3
  {
    re: /(?<![\w:-])(grid-cols-3)(?![\w-])/g,
    replacement: "grid-cols-1 md:grid-cols-3",
  },
  // grid-cols-4 → grid-cols-2 lg:grid-cols-4
  {
    re: /(?<![\w:-])(grid-cols-4)(?![\w-])/g,
    replacement: "grid-cols-2 lg:grid-cols-4",
  },
  // grid-cols-5 → grid-cols-2 lg:grid-cols-5
  {
    re: /(?<![\w:-])(grid-cols-5)(?![\w-])/g,
    replacement: "grid-cols-2 lg:grid-cols-5",
  },
  // grid-cols-6 → grid-cols-2 lg:grid-cols-6
  {
    re: /(?<![\w:-])(grid-cols-6)(?![\w-])/g,
    replacement: "grid-cols-2 lg:grid-cols-6",
  },
  // grid-cols-7/8 → grid-cols-2 lg:grid-cols-N (rare)
  {
    re: /(?<![\w:-])(grid-cols-7)(?![\w-])/g,
    replacement: "grid-cols-2 lg:grid-cols-7",
  },
  {
    re: /(?<![\w:-])(grid-cols-8)(?![\w-])/g,
    replacement: "grid-cols-2 lg:grid-cols-8",
  },
];

const fixed = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let fileReplacements = 0;

  for (const { re, replacement } of RESPONSIVE_RULES) {
    src = src.replace(re, (match) => {
      fileReplacements++;
      return replacement;
    });
  }

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count: fileReplacements });
    totalReplacements += fileReplacements;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No hardcoded grids found.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${totalReplacements} grid(s) in ${fixed.length} file(s):\n`);
for (const f of fixed.slice(0, 15)) {
  console.log(`  ${f.count}× ${f.file}`);
}
if (fixed.length > 15) console.log(`  ... and ${fixed.length - 15} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
