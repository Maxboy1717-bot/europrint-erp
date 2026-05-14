/**
 * @module fix-dup-t-prop
 * @description When a component destructures `t` from props AND ALSO does
 *   `const { t } = useTranslation(...)` in its body, the build fails with
 *   "symbol 't' has already been declared". Drop the body declaration.
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === "dist") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

let fixed = 0;
for (const f of walk(ROOT)) {
  let src = readFileSync(f, "utf8");
  const original = src;

  // Find function declarations that have `t` as a prop and also a body-declaration of `t`.
  // The function signature: `function X({ ..., t, ... } | { ..., t: tX, ... })`
  // We only match where `t` appears as a simple destructure (not aliased away).
  const fnRe = /(function\s+\w+\s*\(\s*\{[^}]*?)\bt\b([\s\S]*?\)\s*\{)/g;
  let m;
  const dropPositions = [];
  while ((m = fnRe.exec(src)) !== null) {
    // Confirm `t` isn't being aliased (`t: alias`)
    const before = src.slice(m.index, m.index + m[0].length);
    if (/\bt\s*:\s*\w+/.test(before)) continue; // already aliased
    // Find the next `const { t } = useTranslation(...)` in this scope (until next `function`)
    const startBody = m.index + m[0].length;
    const restAfter = src.slice(startBody);
    const nextFnIdx = /\bfunction\s+\w+\s*\(/.exec(restAfter)?.index ?? restAfter.length;
    const scope = restAfter.slice(0, nextFnIdx);
    const localDupRe = /(\s*const\s*\{\s*t\b[^}]*\}\s*=\s*useTranslation\([^)]*\)\s*;?)/;
    const dup = localDupRe.exec(scope);
    if (dup) {
      const dupAbs = startBody + (dup.index ?? 0);
      dropPositions.push({ start: dupAbs, end: dupAbs + dup[0].length });
    }
  }

  // Apply drops from the end (so indices stay valid)
  if (dropPositions.length > 0) {
    dropPositions.sort((a, b) => b.start - a.start);
    for (const p of dropPositions) {
      src = src.slice(0, p.start) + src.slice(p.end);
    }
  }

  if (src !== original) {
    writeFileSync(f, src);
    fixed++;
  }
}
console.log("fixed:", fixed);
