/**
 * @module fix-dup-alias
 * @description Repair functions that destructure an alias like `tCommon`
 *   from props AND ALSO declare it via useTranslation in the body. Drops
 *   the body declaration.
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

const aliases = ["tCommon", "tHr", "tFinance", "tProduction", "tWms", "tSales", "tCrm", "tMm", "tQc", "tSecurity", "tIot", "tLms"];

let fixed = 0;
for (const f of walk(ROOT)) {
  let src = readFileSync(f, "utf8");
  const original = src;

  for (const alias of aliases) {
    // Drop `const { t: alias } = useTranslation(...);` ONLY if there's a
    // destructuring pattern that contains `alias` as a prop name anywhere
    // in the same file.
    const propsRe = new RegExp(`\\bfunction\\s+\\w+\\s*\\([^)]*\\b${alias}\\b[^)]*\\)`);
    if (!propsRe.test(src)) continue;
    const dupRe = new RegExp(`\\s*const\\s*\\{\\s*t\\s*:\\s*${alias}\\s*\\}\\s*=\\s*useTranslation\\([^)]*\\)\\s*;?\\s*\\n`, "g");
    src = src.replace(dupRe, "\n");
  }

  if (src !== original) {
    writeFileSync(f, src);
    fixed++;
  }
}
console.log("fixed:", fixed);
