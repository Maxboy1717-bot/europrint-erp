#!/usr/bin/env node
/**
 * @module fix-button-icon-spacing
 * @description Replace the `mr-2` pattern on icons inside `<Button>` with a
 *   parent-level `gap-2`. The Phase-4 sweeper handled only the EPLoader case;
 *   this pass catches ALL icons (Lucide icons, custom svg, EPLoader).
 *
 *   Pattern:
 *     <Button className="…"> <Icon className="h-4 w-4 mr-2" /> Label </Button>
 *
 *   becomes:
 *     <Button className="… gap-2"> <Icon className="h-4 w-4" /> Label </Button>
 *
 *   We only modify when:
 *     - The Button has a className attribute
 *     - The first child looks like an icon-self-closing tag with `mr-2` in
 *       its className
 *     - The Button doesn't already have `gap-` in its className (to avoid
 *       double-applying)
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
let count = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // <Button [...] className="<classes>" [...]>\s*<Icon [...] className="<icon-classes> mr-2 [...]" />
  // We match conservatively: only single-tag, self-closing icon with `mr-2` in its className.
  src = src.replace(
    /(<Button\b[^>]*?className=")([^"]*?)("[^>]*?>)(\s*<\w+\b[^>]*?className=")([^"]*?)\bmr-2\b([^"]*?")([^>]*?\/>)/g,
    (m, btnOpen, btnClasses, btnAttrsEnd, iconStart, iconClassesBefore, iconClassesAfter, iconEnd) => {
      // Don't touch buttons that already have a gap- utility
      if (/\bgap-\d/.test(btnClasses)) return m;
      // Add gap-2 to button, strip mr-2 from icon
      const newBtnClasses = `${btnClasses.trim()} gap-2`.trim();
      const newIconClasses = `${iconClassesBefore}${iconClassesAfter}`
        .replace(/\s+/g, " ")
        .trim();
      count++;
      return `${btnOpen}${newBtnClasses}${btnAttrsEnd}${iconStart}${newIconClasses}"${iconEnd}`;
    },
  );

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${count} button(s) in ${fixed.length} file(s).`);
if (!APPLY) console.log("\nRun with --fix to apply.");
