#!/usr/bin/env node
/**
 * @module fix-duplicate-t
 * @description Earlier auto-migration scripts injected
 *   `const { t } = useTranslation('common');` at the top of components that
 *   already had a different `t` binding (e.g. `const { t } = useLanguage();`).
 *   That makes the build fail with "symbol 't' has already been declared".
 *
 *   For each file we find a duplicate declaration of `t` in the same scope,
 *   drop the SECOND one (the migration-injected line). We always prefer the
 *   pre-existing `useLanguage()`/`useT()`/etc. so we don't silently change
 *   behaviour — those existed for a reason.
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

const fixed = [];

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  const lines = src.split("\n");
  const newLines = [];
  let seenT = false;

  for (const line of lines) {
    // Match a top-of-function `const { t } = X();` declaration
    const m = /^\s*const\s*\{\s*t\b[^}]*\}\s*=\s*\w+\([^)]*\)\s*;?\s*$/.exec(line);
    if (m) {
      if (seenT) {
        // Skip this duplicate `t` declaration
        continue;
      }
      seenT = true;
    }
    // Reset `seenT` when we see another function/component boundary.
    // A new `export function`, `function`, `const X = () =>`, or unindented
    // declaration starts a new scope.
    if (/^(export\s+(default\s+)?function|function\s+\w+|export\s+const\s+\w+\s*=\s*(\(.*\)\s*=>|\w+\.)|const\s+\w+\s*:\s*React\.FC|export\s+default\s+function)/.test(line)) {
      seenT = false;
    }
    newLines.push(line);
  }

  src = newLines.join("\n");

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No duplicate `t` declarations found.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s):\n`);
for (const f of fixed.slice(0, 20)) console.log(`  ${f}`);
if (fixed.length > 20) console.log(`  ... and ${fixed.length - 20} more`);
if (!APPLY) console.log("\nRun with --fix to apply.");
