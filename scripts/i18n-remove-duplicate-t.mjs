#!/usr/bin/env node
/**
 * Remove duplicate `const { t } = useTranslation(...)` declarations created
 * when the v2 hook-injection script added a hook into functions that already
 * have `t` from another source:
 *   - usePosI18n() hook
 *   - prop destructure: function X({ t }: { t: TFn })
 *   - explicit destructure of another translation hook
 *
 * Strategy: scan each file. For each occurrence of
 *   `const { t } = useTranslation("common");`
 * check if `t` is already in scope (from a previous line in the same function
 * or from a prop destructure). If yes, remove that line.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'),
  'artifacts', 'erp-dashboard', 'src');

function walk(d, files = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist'].includes(e.name)) walk(p, files);
    } else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
  return files;
}

let fixed = 0;
let removed = 0;

for (const f of walk(SRC)) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  const lines = content.split('\n');

  // For each line that is the injected hook:
  // `  const { t } = useTranslation("common");`
  // Check the 5 lines IMMEDIATELY before it for:
  //  - another `const { t } = ` declaration
  //  - a function signature with `({ t }` prop destructure
  // If found, mark this line for removal.

  const linesToRemove = new Set();
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/^\s*const\s*\{\s*t\s*\}\s*=\s*useTranslation\(['"]common['"]\);?\s*$/.test(l)) continue;

    // Search backward up to 10 lines for either:
    // (a) another `const { t } = ...` declaration
    // (b) function signature with `({ t }` destructured prop
    let conflict = false;
    for (let j = Math.max(0, i - 12); j < i; j++) {
      const lj = lines[j];
      if (/const\s*\{\s*t\s*[,}]/.test(lj) && /=\s*(?:use\w+\(|\w+\.t\b)/.test(lj)) {
        conflict = true;
        break;
      }
      // Function signature with t prop
      if (/function\s+\w+\s*\(\{[^}]*\bt\b[^}]*\}/.test(lj)) {
        conflict = true;
        break;
      }
      if (/^\s*(?:export\s+(?:default\s+)?)?function\s+\w+/.test(lj)) {
        // We hit a function signature without t prop — stop searching here
        // (this is the function we're inside)
        break;
      }
    }

    if (conflict) {
      linesToRemove.add(i);
    }
  }

  if (linesToRemove.size === 0) continue;

  const newLines = lines.filter((_, i) => !linesToRemove.has(i));
  content = newLines.join('\n');
  if (content === original) continue;
  fs.writeFileSync(f, content, 'utf8');
  fixed++;
  removed += linesToRemove.size;
  console.log(`  ${linesToRemove.size} :: ${path.relative(SRC, f)}`);
}

console.log(`\nFiles fixed: ${fixed}`);
console.log(`Duplicate hooks removed: ${removed}`);
