// Fix misplaced SQL / SQLWrapper imports. They should only come from 'drizzle-orm'.
// 1. Remove SQL / SQLWrapper from any import that isn't drizzle-orm.
// 2. Ensure drizzle-orm import includes them.
// Single-line scope per import via [^}] (no newlines crossed).

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const root = 'apps/api/src';
const files = execSync(
  `grep -rl -E "SQL\\b|SQLWrapper\\b" "${root}"`,
  { encoding: 'utf8' },
).split('\n').filter(Boolean);

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  // Find non-drizzle imports that wrongly include SQL or SQLWrapper.
  // Single-line: capture content inside { ... } that has no newline.
  const importLineRe = /^import\s*\{([^}\n]+)\}\s*from\s*(['"])([^'"]+)\2\s*;?\s*$/gm;
  src = src.replace(importLineRe, (m, items, _q, mod) => {
    if (mod === 'drizzle-orm') return m;
    const parts = items.split(',').map(s => s.trim()).filter(Boolean);
    const filtered = parts.filter(p => p !== 'SQL' && p !== 'SQLWrapper');
    if (filtered.length === parts.length) return m;
    if (filtered.length === 0) return ''; // drop entire empty import
    return `import { ${filtered.join(', ')} } from '${mod}';`;
  });

  // Now check if the file uses SQL or SQLWrapper as a type
  const usesSql = /\bSQL\b/.test(src) && !/from\s*['"]drizzle-orm['"]/.test(src.split('SQL')[0]);
  const usesWrapper = /\bSQLWrapper\b/.test(src);
  const needAdd = [];

  // We always want them re-added to drizzle-orm if they're used anywhere outside imports
  // Easier check: look at any `: SQL ` or `: SQLWrapper` or `SQL |` or `SQL,` after imports
  const useRe = /(:\s*SQL\b|SQL\s*\||SQL\s*,|\|\s*SQL\b|<\s*SQL\b|:\s*SQLWrapper\b|SQLWrapper\s*\||\|\s*SQLWrapper\b)/;
  const usesAny = useRe.test(src);

  if (usesAny) {
    if (/\bSQL\b/.test(src)) needAdd.push('SQL');
    if (/\bSQLWrapper\b/.test(src)) needAdd.push('SQLWrapper');

    // Find drizzle-orm import on a single line
    const drizzleRe = /^import\s*(?:type\s+)?\{([^}\n]+)\}\s*from\s*['"]drizzle-orm['"]\s*;?\s*$/m;
    const m = src.match(drizzleRe);
    if (m) {
      const items = m[1].split(',').map(s => s.trim()).filter(Boolean);
      let changed = false;
      for (const sym of needAdd) {
        if (!items.includes(sym)) { items.push(sym); changed = true; }
      }
      if (changed) {
        items.sort();
        src = src.replace(m[0], `import { ${items.join(', ')} } from 'drizzle-orm';`);
      }
    } else {
      // Add new import for drizzle-orm
      const insertAt = src.search(/^import\s/m);
      const newImport = `import type { ${needAdd.join(', ')} } from 'drizzle-orm';\n`;
      if (insertAt >= 0) {
        src = src.slice(0, insertAt) + newImport + src.slice(insertAt);
      } else {
        src = newImport + src;
      }
    }
  }

  if (src !== original) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed} files`);
