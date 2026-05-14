#!/usr/bin/env node
/**
 * @module standardize-page-shells
 * @description Make every page in `src/pages/` use the canonical EuroPrint
 *   page-shell wrapper:
 *
 *     <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
 *
 *   Common pre-existing patterns we replace:
 *
 *     <div className="space-y-6">                 → canonical
 *     <div className="space-y-4">                 → canonical (gap-4)
 *     <div className="space-y-8">                 → canonical (gap-8)
 *     <div className="p-6 space-y-6">             → canonical
 *     <div className="p-6 space-y-4">             → canonical (gap-4)
 *     <div className="p-4 space-y-4">             → canonical (gap-4)
 *     <div className="space-y-6 p-6">             → canonical
 *     <div className="container mx-auto p-6">     → canonical
 *     <div className="flex-1 overflow-auto p-6">  → canonical (keep h-full)
 *     <div className="p-6 bg-gray-50 min-h-screen"> → canonical (bg removed, AppShell already paints bg)
 *
 *   Only touches the FIRST top-level `<div>` of each page-level file (not
 *   sub-components). We detect "page-level" by file location (immediate
 *   children of src/pages/) and by the file having a `export default function`.
 *
 *   Run:
 *     node scripts/standardize-page-shells.mjs           # report
 *     node scripts/standardize-page-shells.mjs --fix     # apply
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src/pages");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

const CANONICAL = "flex flex-col h-full p-5 lg:p-6 gap-5";

// Map old patterns to the canonical replacement.
// We preserve the original gap size where the source used a different one.
const REPLACEMENTS = [
  // space-y → flex flex-col gap (preserve numeric)
  // p-6 bg-gray-50 min-h-screen — drop bg-gray-50 (AppShell already paints it)
  [/className="p-6 bg-gray-50 min-h-screen"/g, `className="${CANONICAL}"`],
  [/className="bg-gray-50 min-h-screen p-6"/g, `className="${CANONICAL}"`],
  [/className="min-h-screen bg-gray-50 p-6"/g, `className="${CANONICAL}"`],
  // container mx-auto p-6
  [/className="container mx-auto p-6"/g, `className="${CANONICAL}"`],
  [/className="container mx-auto px-6 py-6"/g, `className="${CANONICAL}"`],
  // flex-1 overflow-auto p-6 (with optional space-y)
  [/className="flex-1 overflow-auto p-6 space-y-6"/g, `className="${CANONICAL}"`],
  [/className="flex-1 overflow-auto p-6 space-y-4"/g, `className="${CANONICAL.replace("gap-5", "gap-4")}"`],
  [/className="flex-1 overflow-auto p-6"/g, `className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5"`],
  [/className="flex-1 overflow-auto p-5 space-y-5"/g, `className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5"`],
  // p-6 space-y-N
  [/className="p-6 space-y-6"/g, `className="${CANONICAL}"`],
  [/className="p-6 space-y-4"/g, `className="${CANONICAL.replace("gap-5", "gap-4")}"`],
  [/className="p-4 space-y-4"/g, `className="${CANONICAL.replace("gap-5", "gap-4")}"`],
  [/className="space-y-6 p-6"/g, `className="${CANONICAL}"`],
  [/className="space-y-4 p-6"/g, `className="${CANONICAL.replace("gap-5", "gap-4")}"`],
  // Pure space-y wrappers (no padding)
  [/className="space-y-6"/g, `className="${CANONICAL}"`],
  [/className="space-y-4"/g, `className="${CANONICAL.replace("gap-5", "gap-4")}"`],
  [/className="space-y-8"/g, `className="${CANONICAL.replace("gap-5", "gap-8")}"`],
  // Already-flex-but-no-padding shells (auto-migration output)
  [/className="flex flex-col h-full"/g, `className="${CANONICAL}"`],
  [/className="flex flex-col p-5 lg:p-6 gap-5"/g, `className="${CANONICAL}"`],
];

const fixed = [];
const stats = new Map();

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // Only touch files that have a default-exported component (page-level).
  if (!/export\s+default\s+function/.test(src)) continue;

  // Find the FIRST <div ...> after the return statement of the default export.
  // Apply replacements ONLY to that first occurrence.
  const returnIdx = src.search(/return\s*\(\s*\n?\s*<div/);
  if (returnIdx === -1) continue;

  // Locate the className of that first <div>
  const divStart = src.indexOf("<div", returnIdx);
  const divEnd = src.indexOf(">", divStart);
  if (divStart === -1 || divEnd === -1) continue;

  const divTag = src.slice(divStart, divEnd + 1);
  let newDivTag = divTag;
  for (const [re, replacement] of REPLACEMENTS) {
    newDivTag = newDivTag.replace(re, replacement);
  }

  if (newDivTag !== divTag) {
    src = src.slice(0, divStart) + newDivTag + src.slice(divEnd + 1);
    // Track which pattern was rewritten
    const oldClassNameMatch = divTag.match(/className="([^"]*)"/);
    if (oldClassNameMatch) {
      const k = oldClassNameMatch[1];
      stats.set(k, (stats.get(k) || 0) + 1);
    }
  }

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${APPLY ? "✅ Standardized" : "📋 Would standardize"} ${fixed.length} file(s).`);
if (stats.size > 0) {
  console.log("\nPatterns replaced:");
  for (const [pattern, count] of [...stats.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count} × "${pattern}"`);
  }
}
if (fixed.length > 0 && !APPLY) console.log("\nRun with --fix to apply.");
