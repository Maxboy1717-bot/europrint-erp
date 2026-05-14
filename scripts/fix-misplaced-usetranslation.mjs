#!/usr/bin/env node
/**
 * @module fix-misplaced-usetranslation
 * @description Repairs files where `const { t } = useTranslation('common');`
 *   was incorrectly inserted INSIDE the function-parameter destructure
 *   block (not from this migration — leftover from an earlier agent run).
 *
 *   Broken pattern:
 *
 *     export function Foo({
 *       const { t } = useTranslation('common'); a, b, c }: Props) {
 *
 *   Fixed pattern:
 *
 *     export function Foo({ a, b, c }: Props) {
 *       const { t } = useTranslation('common');
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOTS = [
  resolve("artifacts/erp-dashboard/src"),
];
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

for (const root of ROOTS) {
  for (const file of walk(root)) {
    let src = readFileSync(file, "utf8");
    const original = src;

    // Match: ({\n  const { t } = useTranslation('NS');\n   ...params }: ...) {
    // Use [\s\S]*? (greedy-safe) and balanced detection of the outer destructure `}`.
    // We grab everything up to a `\n}` then continue to the `) {`.
    const re =
      /(\(\{\s*)\n\s*(const\s*\{\s*t\s*\}\s*=\s*useTranslation\(['"][^'"]*['"]\);)([\s\S]*?\n\s*\})(\s*:[\s\S]*?)?\s*\)\s*\{/g;

    src = src.replace(re, (_full, openParen, useT, rest, typeAnnotation) => {
      // Clean up the captured "rest" — drop the leading newline+spaces and
      // the closing brace (we'll add a clean one).
      const cleaned = rest
        .replace(/\}\s*$/, "")
        .replace(/^\s*\n/, "")
        .replace(/\s+/g, " ")
        .trim();
      return `${openParen} ${cleaned} }${typeAnnotation || ""}) {\n  ${useT}`;
    });

    if (src !== original) {
      fixed.push(relative(process.cwd(), file));
      if (APPLY) writeFileSync(file, src, "utf8");
    }
  }
}

if (fixed.length === 0) {
  console.log("✅ No misplaced useTranslation calls found.");
  process.exit(0);
}
console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s):\n`);
for (const f of fixed) console.log(`  ${f}`);
if (!APPLY) console.log("\nRun with --fix to apply.");
