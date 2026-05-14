#!/usr/bin/env node
/**
 * @module migrate-loaders
 * @description Replace raw Lucide `<Loader2 className="..." />` spinners with
 *   the canonical `<EPLoader>` so every page uses the same colour, size,
 *   and animation. Cases handled:
 *
 *     <Loader2 className="animate-spin" />                       → <EPLoader />
 *     <Loader2 className="h-4 w-4 animate-spin" />               → <EPLoader size={16} />
 *     <Loader2 className="h-5 w-5 animate-spin" />               → <EPLoader size={20} />
 *     <Loader2 className="h-6 w-6 animate-spin" />               → <EPLoader size={24} />
 *     <Loader2 className="h-8 w-8 animate-spin text-primary" />  → <EPLoader size={32} />
 *     <Loader2 className="animate-spin text-muted-foreground" /> → <EPLoader tone="muted" />
 *     <Loader2 className="h-4 w-4 animate-spin mr-2" />          → <EPLoader size={16} className="mr-2" />
 *
 *   When the className contains extra utility classes we keep them via the
 *   `className` prop on `<EPLoader>`. We only convert calls that include
 *   `animate-spin` (so we don't accidentally rewrite paused/static icons).
 *
 *   The Lucide `Loader2` import is removed if no other usage remains.
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

const SIZE_MAP = {
  "h-3 w-3": 12, "h-3.5 w-3.5": 14, "h-4 w-4": 16, "h-5 w-5": 20,
  "h-6 w-6": 24, "h-7 w-7": 28, "h-8 w-8": 32, "h-10 w-10": 40, "h-12 w-12": 48,
};

function pickSize(classes) {
  for (const [pattern, px] of Object.entries(SIZE_MAP)) {
    if (classes.includes(pattern)) return { px, pattern };
  }
  return null;
}

function pickTone(classes) {
  if (classes.includes("text-muted-foreground")) return "muted";
  if (classes.includes("text-white")) return "white";
  return null;
}

function stripKnown(classes, removals) {
  let out = classes;
  for (const r of removals) out = out.replace(r, "");
  return out.replace(/\s+/g, " ").trim();
}

const fixed = [];
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;
  let count = 0;

  // Pattern A: self-closing <Loader2 className="..." />
  src = src.replace(
    /<Loader2\s+className=(["'])([^"']*)\1\s*\/>/g,
    (match, q, classes) => {
      if (!classes.includes("animate-spin")) return match;
      const sizeInfo = pickSize(classes);
      const tone = pickTone(classes);
      const stripped = stripKnown(classes, [
        "animate-spin",
        sizeInfo?.pattern,
        "text-primary",
        "text-muted-foreground",
        "text-white",
      ].filter(Boolean));

      count++;
      const props = [];
      if (sizeInfo && sizeInfo.px !== 16) props.push(`size={${sizeInfo.px}}`);
      if (tone) props.push(`tone=${q}${tone}${q}`);
      if (stripped) props.push(`className=${q}${stripped}${q}`);
      return `<EPLoader${props.length ? " " + props.join(" ") : ""} />`;
    },
  );

  // Pattern B: <Loader2 className={`...`} /> with template literal — leave alone
  // (too dynamic to confidently rewrite)

  if (src !== original) {
    // Ensure EPLoader is imported
    if (!/import\s*\{[^}]*\bEPLoader\b[^}]*\}\s*from\s*["']@\/components\/ep["']/.test(src)) {
      // Append to existing @/components/ep import, or add a new one
      const existing = /(import\s*\{)([^}]*)(\}\s*from\s*["']@\/components\/ep["'])/.exec(src);
      if (existing) {
        const names = existing[2].split(",").map((s) => s.trim()).filter(Boolean);
        if (!names.includes("EPLoader")) names.push("EPLoader");
        src = src.replace(existing[0], `${existing[1]} ${names.join(", ")} ${existing[3].trimStart()}`);
      } else {
        // Insert new import after the last existing import line
        const lastImportRe = /^[ \t]*import\s+(?:type\s+)?(?:\w+\s*,?\s*)?(?:\{[^}]+\}|\w+|\*\s*as\s+\w+)?\s*(?:from\s*["'][^"']+["'])?\s*;?\s*\n/gm;
        let lastEnd = 0;
        let mm;
        while ((mm = lastImportRe.exec(src)) !== null) lastEnd = mm.index + mm[0].length;
        if (lastEnd > 0) {
          src = src.slice(0, lastEnd) + `import { EPLoader } from "@/components/ep";\n` + src.slice(lastEnd);
        }
      }
    }

    // Drop the `Loader2` symbol from any `import ... from "lucide-react"` block
    // if it's no longer referenced anywhere in the file.
    if (!/<Loader2\b/.test(src) && !/\bLoader2\b(?!\s*})/.test(src.replace(/import\s*\{[^}]*\}\s*from\s*["']lucide-react["']/g, ""))) {
      src = src.replace(
        /(import\s*\{)([^}]*)(\}\s*from\s*["']lucide-react["'])/g,
        (m, open, body, close) => {
          const names = body.split(",").map((s) => s.trim()).filter(Boolean).filter((n) => n !== "Loader2");
          if (names.length === 0) return ""; // drop whole import line
          return `${open} ${names.join(", ")} ${close.trimStart()}`;
        },
      );
    }

    fixed.push({ file: relative(process.cwd(), file), count });
    totalReplacements += count;
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No raw <Loader2> spinners remaining.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Replaced" : "📋 Would replace"} ${totalReplacements} spinner(s) in ${fixed.length} file(s).`);
const top = fixed.slice().sort((a, b) => b.count - a.count).slice(0, 15);
for (const f of top) console.log(`  ${f.count}× ${f.file}`);
if (!APPLY) console.log("\nRun with --fix to apply.");
