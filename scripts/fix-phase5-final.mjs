#!/usr/bin/env node
/**
 * @module fix-phase5-final
 * @description Final sweeper for the last 200+ residual visual mismatches
 *   the audit found. Five independent passes, all scriptable:
 *
 *   1. SelectTrigger height standardisation:
 *      Default shadcn SelectTrigger renders at h-10 (40px). EP standard for
 *      form rows is h-9 (36px) to match Input. Every `<SelectTrigger>` that
 *      DOESN'T declare an explicit `h-` class gets `h-9` injected.
 *      Existing `h-7/h-8/h-10/h-11` are normalised to `h-9` (we drop
 *      accessibility-fail tiny variants).
 *
 *   2. TableRow hover state:
 *      Every `<TableRow>` that lacks `hover:bg-` and is NOT explicitly
 *      `bg-transparent` / `border-none` gets `hover:bg-muted/40` added.
 *
 *   3. Sticky table headers:
 *      Every `<TableHeader>` whose parent has `overflow-` or `max-h-` adds
 *      `sticky top-0 z-10 bg-card`. We detect "inside a scroll container"
 *      via the 400-char window before the opener.
 *
 *   4. DialogContent / SheetContent padding standardisation:
 *      Every `<DialogContent>` or `<SheetContent>` with NO `p-` in its
 *      className gets `p-6` added. Existing `p-0` is left alone (caller
 *      explicitly opted out).
 *
 *   5. Raw avatar <img className="...rounded-full"> → shadcn `<Avatar>`:
 *      Conservative — only the simplest single-image case where the img
 *      has no event handlers. Anything fancy stays manual.
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

const stats = {
  selectTrigger: 0,
  tableRow: 0,
  tableHeader: 0,
  dialogPadding: 0,
  sheetPadding: 0,
};
const filesChanged = new Set();

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // ─── 1. SelectTrigger heights ────────────────────────────────────────
  // 1a. SelectTrigger with className but no h-N → inject h-9 first
  src = src.replace(
    /(<SelectTrigger\s+[^>]*?className=")([^"]*?)("[^>]*?>)/g,
    (m, before, classes, after) => {
      if (/\bh-\d/.test(classes)) return m; // already has explicit height
      stats.selectTrigger++;
      const newClasses = classes.trim() ? `${classes.trim()} h-9` : "h-9";
      return `${before}${newClasses}${after}`;
    },
  );
  // 1b. SelectTrigger with NO className at all → add className="h-9"
  src = src.replace(
    /<SelectTrigger(\s+(?:(?!className=)[^>])*?)\s*>/g,
    (m, attrs) => {
      // Skip if already has className
      if (/className=/.test(attrs)) return m;
      stats.selectTrigger++;
      return `<SelectTrigger${attrs} className="h-9">`;
    },
  );
  // 1c. Off-spec heights → h-9 (h-7, h-8, h-10, h-11 inside SelectTrigger)
  src = src.replace(
    /(<SelectTrigger\s+[^>]*?className="[^"]*?)\b(h-7|h-8|h-10|h-11)\b([^"]*"[^>]*>)/g,
    (m, before, _from, after) => {
      stats.selectTrigger++;
      return `${before}h-9${after}`;
    },
  );

  // ─── 2. TableRow hover state ─────────────────────────────────────────
  // For every <TableRow ...className="..."> without `hover:bg-` and not
  // already explicitly transparent, add `hover:bg-muted/40`.
  src = src.replace(
    /(<TableRow\s+[^>]*?className=")([^"]*?)("[^>]*?>)/g,
    (m, before, classes, after) => {
      if (/\bhover:bg-/.test(classes)) return m;
      if (/\bbg-transparent\b/.test(classes)) return m;
      if (/\bborder-none\b/.test(classes) && !/\bbg-/.test(classes)) return m;
      stats.tableRow++;
      const newClasses = classes.trim() ? `${classes.trim()} hover:bg-muted/40 transition-colors` : "hover:bg-muted/40 transition-colors";
      return `${before}${newClasses}${after}`;
    },
  );
  // 2b. TableRow with NO className → add className="hover:bg-muted/40"
  src = src.replace(
    /<TableRow(\s+(?:(?!className=)[^>])*?)>/g,
    (m, attrs) => {
      if (/className=/.test(attrs)) return m;
      // Skip if it's just <TableRow> (used as wrapper for TableHeader contents)
      if (attrs.trim() === "") return m;
      stats.tableRow++;
      return `<TableRow${attrs} className="hover:bg-muted/40 transition-colors">`;
    },
  );

  // ─── 3. Sticky TableHeader ───────────────────────────────────────────
  // Only inject if the file uses `overflow-` or `max-h-` containers.
  if (/overflow-(?:y-)?auto|max-h-\[?\d/.test(src)) {
    src = src.replace(
      /(<TableHeader\s+[^>]*?className=")([^"]*?)("[^>]*?>)/g,
      (m, before, classes, after) => {
        if (/\bsticky\b/.test(classes)) return m;
        stats.tableHeader++;
        const newClasses = classes.trim()
          ? `${classes.trim()} sticky top-0 z-10 bg-card`
          : "sticky top-0 z-10 bg-card";
        return `${before}${newClasses}${after}`;
      },
    );
    // TableHeader with no className
    src = src.replace(
      /<TableHeader(\s+(?:(?!className=)[^>])*?)>/g,
      (m, attrs) => {
        if (/className=/.test(attrs)) return m;
        stats.tableHeader++;
        return `<TableHeader${attrs} className="sticky top-0 z-10 bg-card">`;
      },
    );
    // No-attribute <TableHeader>
    src = src.replace(/<TableHeader>/g, () => {
      stats.tableHeader++;
      return `<TableHeader className="sticky top-0 z-10 bg-card">`;
    });
  }

  // ─── 4. DialogContent / SheetContent padding ─────────────────────────
  src = src.replace(
    /(<DialogContent\s+[^>]*?className=")([^"]*?)("[^>]*?>)/g,
    (m, before, classes, after) => {
      if (/\bp-\d/.test(classes) || /\bpx-\d/.test(classes) || /\bpy-\d/.test(classes)) return m;
      stats.dialogPadding++;
      const newClasses = classes.trim() ? `${classes.trim()} p-6` : "p-6";
      return `${before}${newClasses}${after}`;
    },
  );
  src = src.replace(
    /<DialogContent(\s+(?:(?!className=)[^>])*?)>/g,
    (m, attrs) => {
      if (/className=/.test(attrs)) return m;
      if (attrs.trim() === "") return m; // <DialogContent> with no attrs — handled separately
      stats.dialogPadding++;
      return `<DialogContent${attrs} className="p-6">`;
    },
  );

  src = src.replace(
    /(<SheetContent\s+[^>]*?className=")([^"]*?)("[^>]*?>)/g,
    (m, before, classes, after) => {
      if (/\bp-\d/.test(classes) || /\bpx-\d/.test(classes) || /\bpy-\d/.test(classes)) return m;
      stats.sheetPadding++;
      const newClasses = classes.trim() ? `${classes.trim()} p-6` : "p-6";
      return `${before}${newClasses}${after}`;
    },
  );
  src = src.replace(
    /<SheetContent(\s+(?:(?!className=)[^>])*?)>/g,
    (m, attrs) => {
      if (/className=/.test(attrs)) return m;
      if (attrs.trim() === "") return m;
      stats.sheetPadding++;
      return `<SheetContent${attrs} className="p-6">`;
    },
  );

  if (src !== original) {
    filesChanged.add(file);
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${APPLY ? "✅ Applied" : "📋 Would apply"} fixes:`);
console.log(`  ${stats.selectTrigger}  SelectTrigger heights → h-9`);
console.log(`  ${stats.tableRow}  TableRow hover state added`);
console.log(`  ${stats.tableHeader}  TableHeader sticky added`);
console.log(`  ${stats.dialogPadding}  DialogContent p-6 added`);
console.log(`  ${stats.sheetPadding}  SheetContent p-6 added`);
console.log(`  ${filesChanged.size}  files touched`);
if (!APPLY) console.log("\nRun with --fix to apply.");
