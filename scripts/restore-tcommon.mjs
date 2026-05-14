#!/usr/bin/env node
/**
 * @module restore-tcommon
 * @description The fix-duplicate-t.mjs pass was too aggressive — its regex
 *   matched aliased destructures like `const { t: tCommon } = useTranslation('common');`
 *   and dropped them. Re-inject them in files that still reference `tCommon(...)`
 *   but no longer declare it.
 *
 *   Also restore other common aliases this might have killed:
 *     - `const { t: tHr } = useTranslation('hr');`
 *     - `const { t: tFinance } = useTranslation('finance');`
 *     - any `const { t: tXXX } = useTranslation('YYY');` pattern
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

// Best-guess namespace for each well-known alias.
const ALIAS_NAMESPACE = {
  tCommon: "common",
  tHr: "hr",
  tFinance: "finance",
  tProduction: "production",
  tWms: "wms",
  tSales: "sales",
  tCrm: "crm",
  tMm: "mm",
  tQc: "qc",
  tSecurity: "security",
  tIot: "iot",
  tLms: "lms",
};

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  for (const [alias, ns] of Object.entries(ALIAS_NAMESPACE)) {
    // File references the alias (e.g. tCommon('foo'))
    const usesAlias = new RegExp(`\\b${alias}\\(`).test(src);
    if (!usesAlias) continue;

    // Already declares it
    const declared = new RegExp(`const\\s*\\{\\s*t\\s*:\\s*${alias}\\s*\\}\\s*=\\s*useTranslation`).test(src);
    if (declared) continue;

    // Has useTranslation imported?
    if (!/import\s*\{[^}]*\buseTranslation\b[^}]*\}\s*from\s*["']@\/lib\/i18n["']/.test(src)) {
      // Add the import
      const re = /^[ \t]*import[^\n]*\n/gm;
      let lastEnd = 0;
      let mm;
      while ((mm = re.exec(src)) !== null) lastEnd = mm.index + mm[0].length;
      if (lastEnd === 0) continue;
      src = src.slice(0, lastEnd) + `import { useTranslation } from "@/lib/i18n";\n` + src.slice(lastEnd);
    }

    // Find the first `const { t }` or `const { t, ... } = useTranslation(...)`
    // declaration and inject our alias declaration right after it. This keeps
    // both bindings in the same scope.
    const tDeclRe = /(const\s*\{\s*t\b[^}]*\}\s*=\s*useTranslation\([^)]*\)\s*;?)/;
    const declMatch = tDeclRe.exec(src);
    if (declMatch) {
      const injectLine = `\n  const { t: ${alias} } = useTranslation('${ns}');`;
      src = src.replace(tDeclRe, declMatch[1] + injectLine);
    } else {
      // No `const { t } = ...` either — insert at the top of the component body
      // immediately after the first opening brace of an exported function.
      const fnOpen = /(export\s+(?:default\s+)?function\s+\w+[^{]*\{)/;
      const fm = fnOpen.exec(src);
      if (fm) {
        const injectLine = `\n  const ${alias === "tCommon" ? "{ t: tCommon }" : `{ t: ${alias} }`} = useTranslation('${ns}');`;
        src = src.replace(fnOpen, fm[1] + injectLine);
      }
    }
  }

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No tCommon restorations needed.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Restored" : "📋 Would restore"} ${fixed.length} file(s):\n`);
for (const f of fixed.slice(0, 20)) console.log(`  ${f}`);
if (fixed.length > 20) console.log(`  ... and ${fixed.length - 20} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
