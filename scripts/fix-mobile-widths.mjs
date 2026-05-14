#!/usr/bin/env node
/**
 * @module fix-mobile-widths
 * @description Make arbitrary-width filter/select controls collapse on
 *   mobile. Components that set a fixed width like `w-[180px]` or `w-[250px]`
 *   wrap or overflow below 640px. We turn them into `w-full sm:w-[180px]`
 *   so they fill the row on mobile and snap back to fixed-width on tablet+.
 *
 *   We target ONLY widths between 120 and 400px (the common filter / select /
 *   dropdown trigger range). Larger widths (sidebars, modals, etc) are left
 *   alone.
 *
 *   We don't touch:
 *     - classes that already have `sm:`/`md:`/`lg:` prefixes on `w-[Npx]`
 *     - widths inside the public site (different responsive contract)
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

// Match `w-[Npx]` where N is 120..400 and there's no leading `sm:`/`md:`/`lg:`/etc.
// Pattern: word boundary (start, space, or quote), then `w-[`, digits, `px]`.
const WIDTH_RE = /(?<![\w:-])(w-\[(\d+)px\])(?![\w-])/g;

const fixed = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let fileReplacements = 0;

  src = src.replace(WIDTH_RE, (match, fullToken, digits) => {
    const px = parseInt(digits, 10);
    if (px < 120 || px > 400) return match; // out of filter/select range
    fileReplacements++;
    return `w-full sm:${fullToken}`;
  });

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count: fileReplacements });
    totalReplacements += fileReplacements;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No fixed widths in mobile-unsafe range.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${totalReplacements} width(s) in ${fixed.length} file(s):\n`);
for (const f of fixed.slice(0, 15)) console.log(`  ${f.count}× ${f.file}`);
if (fixed.length > 15) console.log(`  ... and ${fixed.length - 15} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
