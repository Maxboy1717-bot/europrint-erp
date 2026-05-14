#!/usr/bin/env node
/**
 * V2: Remove duplicate `const { t } = useTranslation("common");` declarations.
 * Unlike v1 which only searched backward, this also checks forward — useful
 * when the codemod injected useTranslation *before* an existing hook (e.g.
 * `usePosI18n()` that returns `t`).
 *
 * Strategy: within the same function body, if `const { t } = useTranslation('common')`
 * coexists with any other `const { t } = use*()` line, remove the useTranslation one.
 * The other hook (e.g. usePosI18n) is module-specific and was there for a reason.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'),
  'artifacts', 'erp-dashboard', 'src');

function walk(d, files = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist', '__tests__'].includes(e.name)) walk(p, files);
    } else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
  return files;
}

const useTranslationRe = /^\s*const\s*\{\s*t\s*\}\s*=\s*useTranslation\(['"]common['"]\);?\s*$/;
const otherHookRe = /^\s*const\s*\{\s*t[\s,}]/;  // `const { t }` or `const { t, ... }` from any source
const fnSigRe = /^\s*(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+\w+/;
const arrowFnRe = /=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?=>/;

let fixed = 0, removed = 0;

for (const f of walk(SRC)) {
  let content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const toRemove = new Set();

  for (let i = 0; i < lines.length; i++) {
    if (!useTranslationRe.test(lines[i])) continue;

    // Find function boundary: walk backward until function signature.
    let fnStart = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (fnSigRe.test(lines[j]) || arrowFnRe.test(lines[j])) { fnStart = j; break; }
    }
    // Find function end: simplistic — next blank line followed by non-indented or `function ` line.
    let fnEnd = lines.length - 1;
    let depth = 0, seenOpen = false;
    for (let j = fnStart; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') { depth++; seenOpen = true; }
        else if (ch === '}') { depth--; if (seenOpen && depth === 0) { fnEnd = j; break; } }
      }
      if (seenOpen && depth === 0 && j > fnStart) { fnEnd = j; break; }
    }

    // Search the function body for another `const { t } = use...` line.
    for (let j = fnStart; j <= fnEnd; j++) {
      if (j === i) continue;
      const lj = lines[j];
      if (otherHookRe.test(lj) && /=\s*use\w+\(/.test(lj)) {
        toRemove.add(i);
        break;
      }
      // Function signature with `({ t }` prop destructure
      if (/function\s+\w+\s*\([^)]*\{\s*[^}]*\bt\b[^}]*\}/.test(lj)) {
        toRemove.add(i);
        break;
      }
    }
  }

  if (toRemove.size === 0) continue;
  const newLines = lines.filter((_, i) => !toRemove.has(i));
  const next = newLines.join('\n');
  if (next === content) continue;
  fs.writeFileSync(f, next, 'utf8');
  fixed++;
  removed += toRemove.size;
  console.log(`  ${toRemove.size} :: ${path.relative(SRC, f)}`);
}

console.log(`\nFiles fixed: ${fixed}\nDuplicates removed: ${removed}`);
