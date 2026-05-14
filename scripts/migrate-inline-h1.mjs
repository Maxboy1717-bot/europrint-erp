#!/usr/bin/env node
/**
 * @module migrate-inline-h1
 * @description Convert the legacy split-typography heading pattern
 *
 *   <h1 className="text-4xl font-light tracking-tight text-on-surface">
 *     Buxgalter <span className="font-bold text-primary">Ko'rinishi</span>
 *   </h1>
 *   <p className="text-on-surface-variant mt-2">Subtitle text</p>
 *
 * into a canonical <EPPageHeader> call. We also strip the surrounding
 * `<div className="flex items-center justify-between"><div>...</div></div>`
 * wrapper when it only existed to hold this heading + actions.
 *
 * Two safer approaches:
 *
 *   A) Soft: replace just the <h1>...</h1> with `<EPPageHeader title=... />`.
 *      Don't touch surrounding layout. Drop the duplicate `<p>` subtitle if
 *      it sits immediately after the h1.
 *
 *   B) Hard: rewrite the whole `flex justify-between` wrapper. Too risky for
 *      automation.
 *
 * We take approach (A).
 *
 * Run:
 *   node scripts/migrate-inline-h1.mjs            # report
 *   node scripts/migrate-inline-h1.mjs --fix      # apply
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

function hasEPImport(src) {
  return /import\s*\{[^}]*\bEPPageHeader\b[^}]*\}\s*from\s*["']@\/components\/ep["']/.test(src);
}

function ensureEPImport(src) {
  if (hasEPImport(src)) return src;
  // Try to append to an existing `from "@/components/ep"` import
  const re = /(import\s*\{)([^}]*)(\}\s*from\s*["']@\/components\/ep["'])/;
  const m = re.exec(src);
  if (m) {
    const names = m[2].split(",").map((s) => s.trim()).filter(Boolean);
    if (!names.includes("EPPageHeader")) names.push("EPPageHeader");
    return src.replace(re, `${m[1]} ${names.join(", ")} ${m[3].trimStart()}`);
  }
  // Otherwise add a new import after the last existing import statement
  const importRe = /^[ \t]*import[^\n]*\n/gm;
  let lastEnd = 0;
  let mm;
  while ((mm = importRe.exec(src)) !== null) {
    lastEnd = mm.index + mm[0].length;
  }
  if (lastEnd === 0) return src;
  return (
    src.slice(0, lastEnd) +
    `import { EPPageHeader } from "@/components/ep";\n` +
    src.slice(lastEnd)
  );
}

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // Match the split-typography H1 block (may span multiple lines).
  // <h1 className="text-4xl font-light ...">
  //   WORD1 <span className="font-bold ...">WORD2</span>
  // </h1>
  // Optionally followed by an immediate <p className="text-on-surface-variant ...">SUBTITLE</p>
  const h1Re =
    /<h1\s+className="text-(?:3xl|4xl|5xl)\s+font-light[^"]*"[^>]*>([\s\S]*?)<\/h1>(\s*<p\s+className="text-on-surface-variant[^"]*"[^>]*>([\s\S]*?)<\/p>)?/g;

  let changed = false;
  src = src.replace(h1Re, (full, h1Inner, _pBlock, subtitle) => {
    changed = true;

    // h1Inner is something like:  Buxgalter <span className="font-bold ...">Ko'rinishi</span>
    // Strip the span and combine — we just want a clean title string.
    const innerStripped = h1Inner
      .replace(/<span[^>]*>/g, " ")
      .replace(/<\/span>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Detect if the title contains a {t(...)} expression
    const isExpr = /^\{[\s\S]*\}$/.test(innerStripped);

    const titleAttr = isExpr
      ? `title=${innerStripped}`
      : `title="${innerStripped.replace(/"/g, "&quot;")}"`;

    const breadcrumb = isExpr
      ? `breadcrumb={<>Dashboard · <b className="text-foreground">${innerStripped}</b></>}`
      : `breadcrumb={<>Dashboard · <b className="text-foreground">${innerStripped}</b></>}`;

    let subtitleAttr = "";
    if (subtitle) {
      const s = subtitle.replace(/\s+/g, " ").trim();
      const sIsExpr = /^\{[\s\S]*\}$/.test(s);
      subtitleAttr = sIsExpr
        ? `\n        subtitle=${s}`
        : `\n        subtitle="${s.replace(/"/g, "&quot;")}"`;
    }

    return `<EPPageHeader\n        ${breadcrumb}\n        ${titleAttr}${subtitleAttr}\n      />`;
  });

  if (changed) {
    src = ensureEPImport(src);
  }

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No inline H1 patterns left.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s).`);
for (const f of fixed.slice(0, 10)) console.log(`  ${f}`);
if (fixed.length > 10) console.log(`  ... and ${fixed.length - 10} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
