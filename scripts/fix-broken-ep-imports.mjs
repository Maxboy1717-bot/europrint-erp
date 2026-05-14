#!/usr/bin/env node
/**
 * @module fix-broken-ep-imports
 * @description Repairs files where the previous migration script
 *   (`migrate-pages-to-ep.mjs`) inserted `import { EPPageHeader, ... }
 *   from "@/components/ep";` INSIDE another multi-line import block,
 *   breaking the syntax. Pattern looks like:
 *
 *     import {
 *     import { EPErrorState } from "@/components/ep";
 *       DesignOrder, GeneratedDesign,
 *     } from "./X";
 *
 *   The fix: extract the misplaced EP import, restore the original
 *   import block, and append the EP import after the full import area.
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve("artifacts/erp-dashboard/src/pages");
const APPLY = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
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

  // Match the broken pattern: `import {\n` OR `import type {\n` followed by
  // `import { ... } from "@/components/ep";\n`
  const brokenRe = /(import\s+(?:type\s+)?\{\s*\n)(\s*import\s*\{[^}]+\}\s*from\s*["']@\/components\/ep["'];\s*\n)/g;

  const matches = [...src.matchAll(brokenRe)];
  if (matches.length === 0) continue;

  // Collect all misplaced EP imports first
  const misplacedImports = matches.map((m) => m[2].trim());

  // Remove the misplaced lines (keep `import {\n` and what follows)
  src = src.replace(brokenRe, "$1");

  // Append the misplaced EP imports after the full import block
  // Find the end of the import section (last line that starts with `import`
  // OR last `}` that closes a multi-line import)
  const lines = src.split("\n");
  let lastImportEnd = 0;
  let inMultiLine = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inMultiLine) {
      if (/^\s*\}\s*from\s*["']/.test(line)) {
        inMultiLine = false;
        lastImportEnd = i + 1;
      }
      continue;
    }
    if (/^\s*import\s/.test(line)) {
      if (/^\s*import\s*\{[^}]*$/.test(line) && !line.includes("}")) {
        inMultiLine = true;
      } else {
        lastImportEnd = i + 1;
      }
    }
  }

  // Merge: if there's ALREADY an `from "@/components/ep"` import, append names to it.
  // Otherwise insert a new line.
  for (const mis of misplacedImports) {
    const nameMatch = /import\s*\{([^}]+)\}\s*from\s*["']@\/components\/ep["']/.exec(mis);
    if (!nameMatch) continue;
    const newNames = nameMatch[1].split(",").map((s) => s.trim()).filter(Boolean);

    const existing = /import\s*\{([^}]+)\}\s*from\s*["']@\/components\/ep["'];?/;
    const existingMatch = existing.exec(src);
    if (existingMatch) {
      const cur = existingMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      for (const n of newNames) if (!cur.includes(n)) cur.push(n);
      src = src.replace(existing, `import { ${cur.join(", ")} } from "@/components/ep";`);
    } else {
      lines.splice(lastImportEnd, 0, mis);
      src = lines.join("\n");
      lastImportEnd++;
    }
  }

  if (src !== original) {
    fixed.push(relative(process.cwd(), file));
    if (APPLY) writeFileSync(file, src, "utf8");
  }
}

if (fixed.length === 0) {
  console.log("✅ No broken EP imports found.");
  process.exit(0);
}

console.log(`\n${APPLY ? "✅ Fixed" : "📋 Would fix"} ${fixed.length} file(s):\n`);
for (const f of fixed) console.log(`  ${f}`);
if (!APPLY) console.log("\nRun with --fix to apply.");
