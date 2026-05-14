#!/usr/bin/env node
/**
 * @module fix-phase4-visual
 * @description Phase-4 sweeper for the visual mismatches the audit flagged
 *   across ~35 files. Five independent passes:
 *
 *   1. CardTitle font-size: `text-lg` → `text-[14px] font-semibold` (when
 *      the surrounding tag is CardTitle).
 *
 *   2. Off-spec brand-opacity tints:
 *        bg-primary/15  → bg-primary/10
 *        bg-primary/20  → bg-primary/10  (NOT on hover: states — those stay /15)
 *        bg-primary/70  → bg-primary/10
 *        bg-primary/90  → bg-primary (solid)
 *
 *   3. Focus-ring colour normalisation:
 *        focus:ring-blue-500       → focus:ring-primary
 *        focus:ring-orange-500     → focus:ring-primary
 *        focus:ring-NUMBER-NUMBER  → focus:ring-primary
 *
 *   4. `mr-2` on icon inside Button → drop and add `gap-2` to the parent
 *      Button. Detected pattern:
 *        `<Button ...><Icon className="... mr-2" />Text</Button>`
 *      We only modify cases where the Button already has a className we can
 *      append `gap-2` to.
 *
 *   5. Mixed icon size in <Button> — h-5 w-5 inside a button → h-4 w-4
 *      (button standard). KPI tile icons stay at h-[18px].
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
  cardTitle: 0,
  opacity: 0,
  focusRing: 0,
  buttonSpacing: 0,
  buttonIconSize: 0,
};
const filesChanged = new Set();

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // 1. CardTitle font size normalisation
  src = src.replace(
    /(<CardTitle\s+[^>]*?className=")([^"]*?)\btext-(?:lg|xl|2xl)\b([^"]*"[^>]*>)/g,
    (m, before, classes, after) => {
      stats.cardTitle++;
      // Strip any conflicting font weight; we'll set our own
      const cleaned = classes
        .replace(/\bfont-(?:normal|medium|bold)\b/g, "")
        .replace(/\s+/g, " ");
      return `${before}${cleaned}text-[14px] font-semibold${after}`;
    },
  );

  // 2. Brand-opacity normalisation
  //    bg-primary/15 → bg-primary/10  (when NOT hover: prefixed)
  //    bg-primary/20 → bg-primary/10  (same)
  //    bg-primary/70 → bg-primary/10
  //    bg-primary/90 → bg-primary
  // But hover:bg-primary/15 stays — those are intentional hover tints.
  src = src.replace(/(?<!hover:)(?<![\w:-])bg-primary\/15(?![\w-])/g, () => {
    stats.opacity++; return "bg-primary/10";
  });
  src = src.replace(/(?<!hover:)(?<![\w:-])bg-primary\/20(?![\w-])/g, () => {
    stats.opacity++; return "bg-primary/10";
  });
  src = src.replace(/(?<![\w:-])bg-primary\/70(?![\w-])/g, () => {
    stats.opacity++; return "bg-primary/10";
  });
  src = src.replace(/(?<![\w:-])bg-primary\/90(?![\w-])/g, () => {
    stats.opacity++; return "bg-primary";
  });

  // 3. Focus-ring colour normalisation
  src = src.replace(
    /focus:ring-(?:blue|orange|red|green|amber|yellow|purple|violet|cyan|sky|emerald|rose|pink|indigo)-\d{3}/g,
    () => { stats.focusRing++; return "focus:ring-primary"; },
  );

  // 4. mr-2 on EPLoader inside Button — drop and add gap-2 to Button.
  //    Pattern: <Button ...><EPLoader ... className="...mr-2..." />
  //    Conservative: only when Button has a className attribute already.
  src = src.replace(
    /(<Button\b[^>]*?className=")([^"]*?)("[^>]*?>)(\s*<EPLoader\s+[^>]*?className="[^"]*?)\s*mr-2\b/g,
    (m, btnOpen, btnClasses, btnAttrsEnd, iconStart) => {
      stats.buttonSpacing++;
      const newBtnClasses = btnClasses.includes("gap-")
        ? btnClasses
        : `${btnClasses} gap-2`.replace(/^\s+|\s+$/g, "");
      const newIconStart = iconStart.replace(/\s*mr-2\b/, "");
      return `${btnOpen}${newBtnClasses}${btnAttrsEnd}${newIconStart}`;
    },
  );

  // 5. h-5 w-5 inside <Button> → h-4 w-4 (button icon standard)
  src = src.replace(
    /(<Button\b[^>]*>[\s\S]*?<\w+\s+[^>]*?className=")([^"]*?)\bh-5 w-5\b([^"]*"[^>]*?\/>)/g,
    (m, before, classes, after) => {
      stats.buttonIconSize++;
      return `${before}${classes}h-4 w-4${after}`;
    },
  );

  if (src !== original) {
    filesChanged.add(file);
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

console.log(`\n${APPLY ? "✅ Applied" : "📋 Would apply"} fixes:`);
console.log(`  ${stats.cardTitle}  CardTitle font-size`);
console.log(`  ${stats.opacity}  brand-opacity tints normalised`);
console.log(`  ${stats.focusRing}  focus rings → primary`);
console.log(`  ${stats.buttonSpacing}  button mr-2 → gap-2`);
console.log(`  ${stats.buttonIconSize}  button icon h-5 → h-4`);
console.log(`  ${filesChanged.size}  files touched`);
if (!APPLY) console.log("\nRun with --fix to apply.");
