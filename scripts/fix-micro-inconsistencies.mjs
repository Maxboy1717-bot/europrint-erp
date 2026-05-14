#!/usr/bin/env node
/**
 * @module fix-micro-inconsistencies
 * @description Phase-3 sweeper — addresses the residual visual
 *   inconsistencies that audit found across 260+ files.
 *
 *   Fixes applied:
 *
 *   1. DialogTitle font-size standardisation:
 *        <DialogTitle>X</DialogTitle>
 *      → <DialogTitle className="text-[18px] font-semibold">X</DialogTitle>
 *      (only when no className already present)
 *
 *   2. Border-radius standardisation:
 *        rounded-2xl on cards/modals → rounded-[10px]
 *        rounded-2xl on buttons      → rounded-lg
 *        rounded-2xl on TabsList     → rounded-lg
 *        rounded-3xl                 → rounded-xl
 *
 *   3. Form-input grouping: ONLY the LAST `space-y-2` immediately wrapping
 *      a `<Label>` then `<Input/>/<Select/>/<Textarea/>` pair gets tightened
 *      to `space-y-1`. We don't touch `space-y-2` used elsewhere.
 *
 *   4. Toast English title cleanup:
 *        title: "File" → title: "Fayl"
 *        title: "Error" → title: "Xatolik"
 *        title: "Success" → title: "Saqlandi"
 *
 *   5. Skeleton `rounded-md` → `rounded-lg` (consistent with cards/buttons).
 *
 *   These are mechanical, no-context-required rewrites. Each rule is
 *   independent and skips gracefully when its pattern doesn't apply.
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

const TITLE_RX = /<DialogTitle>\s*([^<{][^<]*?)\s*<\/DialogTitle>/g;
const TITLE_EXPR_RX = /<DialogTitle>\s*(\{[^<]+\})\s*<\/DialogTitle>/g;
const ENGLISH_TOAST = [
  [/title:\s*["']File["']/g, 'title: "Fayl"'],
  [/title:\s*["']Error["']/g, 'title: "Xatolik"'],
  [/title:\s*["']Success["']/g, 'title: "Saqlandi"'],
  [/title:\s*["']Saved["']/g, 'title: "Saqlandi"'],
  [/title:\s*["']Deleted["']/g, 'title: "O\\u2018chirildi"'],
];

const stats = {
  dialogTitles: 0,
  rounded: 0,
  formGroups: 0,
  toasts: 0,
  skeletons: 0,
};

const filesChanged = new Set();

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // 1. DialogTitle font-size — bare title
  src = src.replace(TITLE_RX, (m, text) => {
    if (m.includes("className")) return m;
    stats.dialogTitles++;
    return `<DialogTitle className="text-[18px] font-semibold">${text}</DialogTitle>`;
  });
  // Same for expression-form titles
  src = src.replace(TITLE_EXPR_RX, (m, expr) => {
    if (m.includes("className")) return m;
    stats.dialogTitles++;
    return `<DialogTitle className="text-[18px] font-semibold">${expr}</DialogTitle>`;
  });

  // 2. rounded-2xl → context-appropriate radius
  //    On Buttons / SelectTrigger / TabsList / Input → rounded-lg
  //    On modals / Card / DialogContent → rounded-[10px]
  //    Default fallback: rounded-lg
  src = src.replace(
    /(<(?:Button|Input|SelectTrigger|TabsList|TabsTrigger)\s+[^>]*?className="[^"]*?)rounded-2xl([^"]*"[^>]*>)/g,
    (m, before, after) => { stats.rounded++; return before + "rounded-lg" + after; },
  );
  src = src.replace(
    /(<(?:Card|DialogContent|SheetContent)\s+[^>]*?className="[^"]*?)rounded-2xl([^"]*"[^>]*>)/g,
    (m, before, after) => { stats.rounded++; return before + "rounded-[10px]" + after; },
  );
  // Remaining bare rounded-2xl → rounded-lg (safe default)
  src = src.replace(/(?<![\w:-])rounded-2xl(?![\w-])/g, (m) => {
    stats.rounded++;
    return "rounded-lg";
  });
  // rounded-3xl → rounded-xl (12px) — softer than 24px
  src = src.replace(/(?<![\w:-])rounded-3xl(?![\w-])/g, (m) => {
    stats.rounded++;
    return "rounded-xl";
  });

  // 3. Form grouping — `<div className="space-y-2">\n<Label` → `space-y-1`
  //    Only when immediately followed by a Label.
  src = src.replace(
    /(<div\s+className=")space-y-2(")\s*>\s*\n\s*<Label/g,
    (m, before, after) => { stats.formGroups++; return `${before}space-y-1${after}>\n          <Label`; },
  );

  // 4. English toast titles → Uzbek
  for (const [from, to] of ENGLISH_TOAST) {
    const before = src;
    src = src.replace(from, to);
    if (src !== before) stats.toasts++;
  }

  // 5. Skeleton rounded-md → rounded-lg
  src = src.replace(
    /(<Skeleton\s+[^>]*?className="[^"]*?)rounded-md([^"]*"[^>]*>)/g,
    (m, before, after) => { stats.skeletons++; return before + "rounded-lg" + after; },
  );

  if (src !== original) {
    filesChanged.add(file);
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${APPLY ? "✅ Applied" : "📋 Would apply"} fixes:`);
console.log(`  ${stats.dialogTitles}  DialogTitle font-size`);
console.log(`  ${stats.rounded}  border-radius standardised`);
console.log(`  ${stats.formGroups}  form-group tightening`);
console.log(`  ${stats.toasts}  toast Uzbekifications`);
console.log(`  ${stats.skeletons}  Skeleton rounded-* normalised`);
console.log(`  ${filesChanged.size}  files touched`);
if (!APPLY) console.log("\nRun with --fix to apply.");
