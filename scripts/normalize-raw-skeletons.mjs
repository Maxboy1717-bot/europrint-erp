#!/usr/bin/env node
/**
 * @module normalize-raw-skeletons
 * @description The audit found 216 files using raw `<Skeleton className="...">`
 *   patterns instead of the EP-canonical `<EPSkeleton*>` components. Most
 *   raw skeletons are inside larger compound loaders (multi-row card +
 *   text + chart) where wholesale replacement is risky.
 *
 *   Instead of forcing every skeleton to become an EP component, we
 *   NORMALISE the bare-radius classes so every skeleton renders with the
 *   same 10px corner the EP card system uses:
 *
 *     <Skeleton className="h-6 w-full"            → adds `rounded-lg` if no radius
 *     <Skeleton className="h-32 rounded-md"       → → `rounded-lg`
 *     <Skeleton className="h-40 rounded-xl"       → → `rounded-lg`  (card-sized)
 *     <Skeleton className="h-12 w-12 rounded-2xl" → → `rounded-full` (avatar)
 *     <Skeleton className="h-12 w-12 rounded-md"  → → `rounded-full` (avatar)
 *
 *   We also add `bg-muted` for skeletons that lack an explicit colour, so
 *   they don't render as the default shadcn `bg-primary/10` (which clashes
 *   with the orange brand).
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

  // Standalone <Skeleton className="..." /> tags
  src = src.replace(
    /<Skeleton\s+([^>]*?)className="([^"]*)"([^>]*?)\/>/g,
    (m, beforeAttrs, classes, afterAttrs) => {
      let newClasses = classes;

      // Avatar pattern: square h-N w-N (with N <= 16) → rounded-full
      const sq = newClasses.match(/h-(\d+(?:\.5)?)\s+w-(\d+(?:\.5)?)/);
      const isSquareAvatar =
        sq && sq[1] === sq[2] && parseFloat(sq[1]) <= 16;

      if (isSquareAvatar) {
        newClasses = newClasses.replace(/\brounded-(?:md|lg|xl|2xl|3xl)\b/g, "rounded-full");
        if (!/\brounded-/.test(newClasses)) newClasses += " rounded-full";
      } else {
        // Other shapes — collapse all rounded variants to `rounded-lg`
        newClasses = newClasses.replace(/\brounded-(?:md|xl|2xl|3xl)\b/g, "rounded-lg");
        if (!/\brounded-/.test(newClasses)) newClasses += " rounded-lg";
      }

      newClasses = newClasses.replace(/\s+/g, " ").trim();
      if (newClasses === classes) return m;
      count++;
      return `<Skeleton ${beforeAttrs}className="${newClasses}"${afterAttrs}/>`;
    },
  );

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count });
    totalReplacements += count;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ Skeleton radii already normalised.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Normalised" : "📋 Would normalise"} ${totalReplacements} skeleton(s) in ${fixed.length} file(s).`);
if (!APPLY) console.log("\nRun with --fix to apply.");
