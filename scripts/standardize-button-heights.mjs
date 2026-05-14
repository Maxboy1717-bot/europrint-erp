#!/usr/bin/env node
/**
 * @module standardize-button-heights
 * @description Buttons in the EuroPrint system are 8px padding ≈ 36px tall
 *   (Tailwind `h-9`). Many pages mix `h-8` / `h-10` / `h-11` / `h-12` on
 *   the same component, which creates a wavy toolbar.
 *
 *   We standardize the most common off-spec heights on `<Button>` and
 *   `<Input>` elements to `h-9`. Other heights are preserved when used on
 *   non-button components (avatars, badges, sliders, etc).
 *
 *   Pattern:
 *
 *     <Button className="... h-8 ..."> → <Button className="... h-9 ...">
 *     <Input  className="... h-10 ..."> → <Input  className="... h-9 ...">
 *
 *   We keep h-7 (icon-only mini buttons) and h-12+ (jumbo CTAs) alone.
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

  // <Button ... className="... h-8 ..." → h-9
  src = src.replace(
    /(<(?:Button|Input)\s+[^>]*className="[^"]*\s)h-8(\s[^"]*"[^>]*>)/g,
    (m, before, after) => { count++; return before + "h-9" + after; },
  );
  // <Button ... className="... h-10 ..." → h-9
  src = src.replace(
    /(<(?:Button|Input)\s+[^>]*className="[^"]*\s)h-10(\s[^"]*"[^>]*>)/g,
    (m, before, after) => { count++; return before + "h-9" + after; },
  );

  if (src !== original) {
    fixed.push({ file: relative(process.cwd(), file), count });
    totalReplacements += count;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ Button/input heights already consistent.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Standardized" : "📋 Would standardize"} ${totalReplacements} height(s) in ${fixed.length} file(s).`);
if (!APPLY) console.log("\nRun with --fix to apply.");
