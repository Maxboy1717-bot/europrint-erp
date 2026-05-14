#!/usr/bin/env node
/**
 * @module migrate-inline-empty-states
 * @description Replace inline `text-center py-N text-muted-foreground` empty
 *   messages with `<EPEmptyState>` where the pattern is obvious. We only
 *   touch the simple `<div className="text-center py-N text-muted-foreground">
 *   {message}</div>` form — anything more elaborate (multiple paragraphs,
 *   custom icons inside) we leave alone for manual review.
 *
 *   Conservative: this pass only normalises the inline class to use the
 *   EP gap / colour conventions, so the page-to-page look stays uniform
 *   even when we don't fully convert to `<EPEmptyState>`. The component
 *   conversion is a larger refactor and remains a follow-up.
 *
 *   Transform:
 *
 *     <div className="text-center py-12 text-muted-foreground">
 *       Hech narsa topilmadi
 *     </div>
 *
 *   stays structurally the same but its className is normalised to:
 *
 *     <div className="text-center py-12 text-[13px] text-muted-foreground">
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
      entry === "dist"
    ) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

const fixed = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let count = 0;

  // Normalise `<div className="text-center py-N text-muted-foreground">`
  // to also include `text-[13px]` so all empty messages render at the
  // same canonical body size.
  src = src.replace(
    /className="text-center py-(\d+) text-muted-foreground"/g,
    (m, py) => {
      // Skip if already has text-size
      if (m.includes("text-[")) return m;
      count++;
      return `className="text-center py-${py} text-[13px] text-muted-foreground"`;
    },
  );

  // Also normalise the inverted attribute order:
  // `className="py-N text-muted-foreground text-center"`
  src = src.replace(
    /className="py-(\d+) text-muted-foreground text-center"/g,
    (m, py) => {
      count++;
      return `className="text-center py-${py} text-[13px] text-muted-foreground"`;
    },
  );

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count });
    totalReplacements += count;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No inline empty-state classes to normalise.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Normalised" : "📋 Would normalise"} ${totalReplacements} empty-state(s) in ${fixed.length} file(s).`);
if (!APPLY) console.log("\nRun with --fix to apply.");
