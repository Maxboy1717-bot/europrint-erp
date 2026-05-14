#!/usr/bin/env node
/**
 * @module fix-ep-title-expressions
 * @description Repairs files where the migration script encoded JSX expression
 *   values (e.g. `title={t("variance.title")}`) as literal strings:
 *
 *     title="t(\"variance.title\")"
 *     breadcrumb={<>Dashboard · <b ...>t("variance.title")</b></>}
 *
 *   This script restores them to proper JSX expressions:
 *
 *     title={t("variance.title")}
 *     breadcrumb={<>Dashboard · <b ...>{t("variance.title")}</b></>}
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

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // Pattern: title="t('X.Y'[, 'fallback'])" → title={t('X.Y'[, 'fallback'])}
  // (Migration script encoded JSX expressions as strings.)
  src = src.replace(
    /title="(t\([^"]+\))"/g,
    (_, expr) => `title={${expr}}`,
  );

  // Pattern: breadcrumb <b>t('X.Y'[, 'fallback'])</b> → breadcrumb <b>{t('X.Y'[, 'fallback'])}</b>
  src = src.replace(
    /(<b[^>]*>)(t\([^<]+?\))(<\/b>)/g,
    (_, openTag, expr, closeTag) => `${openTag}{${expr}}${closeTag}`,
  );

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No broken title expressions found.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s):\n`);
for (const f of fixed) console.log(`  ${f}`);
if (!APPLY) console.log("\nRun with --fix to apply.");
