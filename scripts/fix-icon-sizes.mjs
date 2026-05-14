/**
 * @module fix-icon-sizes
 * @description Standardize Lucide icon sizes inside common containers:
 *
 *   - Inside <Button> / <DropdownMenuItem> / <SelectItem>:  h-4 w-4
 *   - Inside <SidebarMenuButton>:                           h-4 w-4
 *   - Inside a 42px round tile (`ep-icon-tile` or className with `rounded-full p-3`): h-5 w-5
 *
 *   Specifically: <Icon className="h-5 w-5 ..."> inside <Button> → h-4 w-4.
 *   This is the most common visual rhythm break.
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

  // Find <Button>...</Button> blocks (non-greedy, single-line approximation)
  // and shrink h-5 w-5 → h-4 w-4 inside that block.
  src = src.replace(/<Button\b[^>]*>[\s\S]*?<\/Button>/g, (block) => {
    return block.replace(/\bh-5 w-5\b/g, () => { count++; return "h-4 w-4"; });
  });

  // Same for <DropdownMenuItem> and <SelectItem>
  src = src.replace(/<DropdownMenuItem\b[^>]*>[\s\S]*?<\/DropdownMenuItem>/g, (block) => {
    return block.replace(/\bh-5 w-5\b/g, () => { count++; return "h-4 w-4"; });
  });
  src = src.replace(/<SelectItem\b[^>]*>[\s\S]*?<\/SelectItem>/g, (block) => {
    return block.replace(/\bh-5 w-5\b/g, () => { count++; return "h-4 w-4"; });
  });

  if (src !== before) {
    files.add(f);
    writeFileSync(f, src);
  }
}

console.log(`fixed: ${count} icon size(s) in ${files.size} file(s)`);
