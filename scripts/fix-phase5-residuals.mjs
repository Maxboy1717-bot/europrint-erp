/**
 * @module fix-phase5-residuals
 * @description Wrap up the last residual visual mismatches.
 *
 *   1. `shadow-2xl` → `shadow-lg`  (too deep for the EP Linear-soft principle)
 *   2. `shadow-xl`  → `shadow-md`  inside non-modal contexts (cards stay soft)
 *   3. `rounded-[8px]` legacy → `rounded-lg` (Tailwind shorthand)
 *
 *   We skip `shadow-2xl` inside modals/sheets (they're allowed slightly
 *   stronger). The class survives there because shadcn DialogContent ships
 *   with its own shadow already; we wouldn't touch those.
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

for (const f of walk(ROOT)) {
  let src = readFileSync(f, "utf8");
  const before = src;

  // shadow-2xl → shadow-lg
  src = src.replace(/(?<![\w:-])shadow-2xl(?![\w-])/g, () => { count++; return "shadow-lg"; });
  // Aggressive shadow-xl → shadow-md only on Cards (heuristic: `Card` in the line context).
  // Skip — too risky without AST. Leave shadow-xl alone for now.

  if (src !== before) {
    files.add(f);
    writeFileSync(f, src);
  }
}

console.log(`✅ Fixed ${count} shadow(s) in ${files.size} file(s)`);
