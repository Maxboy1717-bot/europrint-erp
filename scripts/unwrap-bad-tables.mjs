/**
 * @module unwrap-bad-tables
 * @description The `wrap-tables-mobile.mjs` script wrapped EVERY `<Table`
 *   prefix it found, including Lucide icons (`<Tablet>`, `<TableProperties>`)
 *   and TS generics (`<TablesResponse>`). This script undoes those
 *   accidental wraps — it only KEEPS wrappers around shadcn `<Table>` tags
 *   (followed by `>` or whitespace, not by additional letters).
 *
 *   Approach:
 *     For every `<div className="ep-table-scroll">` opener, look at the
 *     character immediately following the next `<` it contains. If that's
 *     a `Table` followed by anything OTHER than `>` or whitespace
 *     (so `Tablet`, `Tables`, etc.), un-wrap.
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "europrint-site" || e === "node_modules" || e === "dist") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

let unwrapped = 0;
const filesChanged = new Set();

for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  const original = src;

  // Pattern A: `<div className="ep-table-scroll"><Tablet ... />`
  // or `<div className="ep-table-scroll"><Tab[anything-other-than->-or-whitespace]`
  // We unwrap by removing the `<div className="ep-table-scroll">` PREFIX and
  // also removing the next `</div>` that follows the self-closing tag.

  // First, find every `<div className="ep-table-scroll">` and inspect what comes after
  let i = 0;
  while (true) {
    const openIdx = src.indexOf(`<div className="ep-table-scroll">`, i);
    if (openIdx === -1) break;
    const after = src.slice(openIdx + 33);
    // Look at first `<` in `after` — should be `<Table` followed by `>` or whitespace.
    const nextLt = after.indexOf("<");
    if (nextLt === -1) { i = openIdx + 33; continue; }
    const charAfter = after.slice(nextLt + 1, nextLt + 30);

    // A real shadcn <Table> usage will contain <TableBody|TableHeader|TableRow within
    // the next ~500 chars and have a matching </Table> closer. Lucide <Table> icon
    // is self-closing or has no Table* children.
    const nextChunk = after.slice(nextLt, nextLt + 800);
    const isLucideIcon = /^<Table[^>]*\/>/.test(charAfter) || // self-closing
      (!/<Table(Body|Header|Row|Cell|Caption|Foot)/.test(nextChunk));
    // Also catch <Tablet ... /> and other <TableX>
    const isOtherTagStartingWithTable = /^Table[a-z]/.test(charAfter); // Tablet, Tables, etc.

    if (!isLucideIcon && !isOtherTagStartingWithTable) {
      // Legit shadcn Table wrap — skip
      i = openIdx + 33;
      continue;
    }

    // Wrong wrap — unwrap. Remove the opener and the matching `</div>`.
    // Find the matching `</div>` that closes this specific wrap. Track depth.
    let depth = 1;
    let j = openIdx + 33;
    while (j < src.length && depth > 0) {
      const nextOpenDiv = src.indexOf("<div", j);
      const nextCloseDiv = src.indexOf("</div>", j);
      if (nextCloseDiv === -1) { j = -1; break; }
      if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
        depth++;
        j = nextOpenDiv + 4;
      } else {
        depth--;
        j = nextCloseDiv + 6;
      }
    }
    if (j === -1) { i = openIdx + 33; continue; }

    // j is now the index AFTER the matching `</div>`. Remove the opener
    // (`<div className="ep-table-scroll">`) and the closing `</div>`.
    const before = src.slice(0, openIdx);
    const middle = src.slice(openIdx + 33, j - 6);
    const tail = src.slice(j);
    src = before + middle + tail;
    unwrapped++;
    // continue from same idx (since we removed text)
    i = openIdx;
  }

  if (src !== original) {
    writeFileSync(file, src);
    filesChanged.add(file);
  }
}

console.log(`✅ Unwrapped ${unwrapped} bad table wrappers in ${filesChanged.size} file(s).`);
