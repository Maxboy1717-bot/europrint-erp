/**
 * @module normalize-h1-text-3xl
 * @description Normalize bare `<h1 className="text-3xl font-bold">` headings
 *   that the earlier migration missed (the regex only caught
 *   `text-4xl font-light` split-typography variants).
 *
 *   Strategy: just normalise the h1's own className to use the canonical
 *   EP page-title size (20px / semibold). Pages keep their structure;
 *   only the heading visual changes. This keeps the migration safe — we
 *   don't restructure the whole page.
 *
 *   Patterns handled:
 *     <h1 className="text-3xl font-bold ...">   → <h1 className="ep-h1 ...">
 *     <h1 className="text-4xl font-bold ...">   → <h1 className="ep-h1 ...">
 *     <h1 className="text-5xl font-bold ...">   → <h1 className="ep-h1 ...">
 *
 *   Inside `components/dizayn-new/Login.tsx` we keep the larger size since
 *   that's a marketing-style hero, not an ERP page header.
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === "dist" || e === "europrint-site") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

let count = 0;
const files = new Set();

const SKIP_FILES = new Set([
  // Marketing / login hero — keep large
  "Login.tsx",
  // EP component implementation files — they DEFINE the headings
  "EPPageHeader.tsx",
]);

for (const f of walk(ROOT)) {
  // Skip files in the skip list
  const filename = f.split(/[\\/]/).pop();
  if (SKIP_FILES.has(filename)) continue;

  let src = readFileSync(f, "utf8");
  const before = src;

  // Replace text-Nxl + font-{semibold|bold|black|light|extrabold} on h1 with ep-h1
  src = src.replace(
    /(<h1\s+[^>]*?className=")([^"]*?)\btext-(?:3xl|4xl|5xl)\b([^"]*?)("[^>]*?>)/g,
    (m, before, beforeClasses, afterClasses, after) => {
      // Strip conflicting font weight / leading / tracking classes
      let cleaned = (beforeClasses + " " + afterClasses)
        .replace(/\bfont-(?:light|normal|medium|semibold|bold|extrabold|black)\b/g, "")
        .replace(/\btracking-(?:tight|tighter|wide)\b/g, "")
        .replace(/\bleading-(?:none|tight|snug)\b/g, "")
        .replace(/\bmb-\d/g, "")
        .replace(/\s+/g, " ")
        .trim();
      count++;
      return `${before}ep-h1${cleaned ? " " + cleaned : ""}${after}`;
    },
  );

  if (src !== before) {
    files.add(f);
    writeFileSync(f, src);
  }
}

console.log(`✅ Normalised ${count} <h1> heading(s) in ${files.size} file(s)`);
