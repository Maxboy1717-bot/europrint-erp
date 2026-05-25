#!/usr/bin/env node
/**
 * @module wrap-tables-mobile
 * @description Wrap any standalone shadcn `<Table>` that doesn't already
 *   live inside an `overflow-x-auto` / `ep-table-scroll` container so it
 *   scrolls horizontally on mobile instead of overflowing the page.
 *
 *   We DON'T touch tables that are already wrapped (looking 2 lines back
 *   for `overflow-` or `ep-table-scroll`).
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
let totalWrapped = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // Find every `<Table>` opener (with optional className)
  // and check whether the 200 chars before it mention `overflow-x` or `ep-table-scroll`.
  // If not, wrap the entire `<Table>...</Table>` block in
  // `<div className="ep-table-scroll">...</div>`.
  let cursor = 0;
  const out = [];
  let count = 0;

  while (true) {
    const openIdx = src.indexOf("<Table", cursor);
    if (openIdx === -1) {
      out.push(src.slice(cursor));
      break;
    }
    // Skip TableHeader, TableBody, TableRow, TableCell, TableFoot, TableHead, TableCaption
    const next4 = src.substr(openIdx + 6, 1);
    if (/[A-Z]/.test(next4)) {
      out.push(src.slice(cursor, openIdx + 6));
      cursor = openIdx + 6;
      continue;
    }
    // Look 200 chars back for `overflow-x` or `ep-table-scroll`
    const context = src.slice(Math.max(0, openIdx - 200), openIdx);
    if (/overflow-x|ep-table-scroll/.test(context)) {
      out.push(src.slice(cursor, openIdx + 6));
      cursor = openIdx + 6;
      continue;
    }
    // Find matching `</Table>` (not </TableX>)
    let depth = 1;
    let i = openIdx + 6;
    while (i < src.length && depth > 0) {
      const nextOpen = src.indexOf("<Table>", i);
      const nextClose = src.indexOf("</Table>", i);
      if (nextClose === -1) { i = src.length; break; }
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 7;
      } else {
        depth--;
        i = nextClose + 8;
      }
    }
    const blockEnd = i;
    if (blockEnd > src.length) {
      out.push(src.slice(cursor));
      break;
    }
    // Append everything up to the open tag, then the wrapper-opener, then the
    // table block, then the wrapper-closer.
    out.push(src.slice(cursor, openIdx));
    out.push(`<div className="ep-table-scroll">`);
    out.push(src.slice(openIdx, blockEnd));
    out.push(`</div>`);
    count++;
    cursor = blockEnd;
  }

  const newSrc = out.join("");
  if (newSrc !== original) {
    fixed.push({ file: relative(process.cwd(), file), count });
    totalWrapped += count;
    if (APPLY) writeFileSync(file, newSrc, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ All tables already wrapped.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Wrapped" : "📋 Would wrap"} ${totalWrapped} table(s) in ${fixed.length} file(s):\n`);
for (const f of fixed.slice(0, 15)) console.log(`  ${f.count}× ${f.file}`);
if (fixed.length > 15) console.log(`  ... and ${fixed.length - 15} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
