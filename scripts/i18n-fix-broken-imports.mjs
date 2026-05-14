#!/usr/bin/env node
/**
 * Fix import statements that got broken when i18n-fix-missing-hooks.mjs
 * inserted `import { useTranslation } ...` in the middle of a multi-line
 * import (e.g., `import type { ... } from "..."` spanning multiple lines).
 *
 * Strategy:
 *   1. Find the inserted `import { useTranslation } from '@/lib/i18n';` line
 *   2. Check if it's between an `import ... {` (open) and its closing `}`
 *   3. If yes, move the useTranslation import OUT (above the broken statement)
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

for (const f of walk(SRC)) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  const lines = content.split('\n');

  let changed = false;
  // Track open multi-line imports
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Is this our useTranslation import?
    if (!/^import\s*\{\s*useTranslation\s*\}\s+from\s+['"]@\/lib\/i18n['"];?\s*$/.test(l)) continue;

    // Look back to see if there's an unclosed `import ... {` above us
    let openImportLine = -1;
    for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
      const lj = lines[j];
      // If we hit a line that closes an import, stop searching
      if (/\}\s+from\s+['"]/.test(lj)) break;
      // If we hit an unclosed import opening
      if (/^import\s/.test(lj) && /\{\s*$/.test(lj)) {
        openImportLine = j;
        break;
      }
    }

    if (openImportLine !== -1) {
      // Move useTranslation import to before the open import
      const moved = lines.splice(i, 1)[0];
      lines.splice(openImportLine, 0, moved);
      changed = true;
      i--; // adjust
    }
  }

  if (changed) {
    content = lines.join('\n');
    if (content !== original) {
      fs.writeFileSync(f, content, 'utf8');
      fixed++;
      console.log(`  fixed :: ${path.relative(SRC, f)}`);
    }
  }
}

console.log(`\nFiles fixed: ${fixed}`);
