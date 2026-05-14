/**
 * Strip the spurious `""` artifact my button-icon-spacing script introduced.
 * Pattern: `className="some classes "" />`
 * Becomes: `className="some classes" />`
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
for (const f of walk(ROOT)) {
  let src = readFileSync(f, "utf8");
  const before = src;
  // The exact corruption: `something "" />` (or with `\s+` between)
  src = src.replace(/(className="[^"]*?)\s*""\s*\/>/g, '$1" />');
  if (src !== before) {
    writeFileSync(f, src);
    count++;
  }
}
console.log("fixed:", count);
