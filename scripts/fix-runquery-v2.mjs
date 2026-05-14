// SAFE version: replace `Parameters<typeof db.execute>[0]` with `SQL | SQLWrapper`
// in type positions. Add `SQL`/`SQLWrapper` to drizzle-orm import using STRICT
// single-line regex. Never touches other imports.

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync(
  `grep -rl "Parameters<typeof db\\.execute>\\[0\\]" apps/api/src`,
  { encoding: 'utf8' },
).split('\n').filter(Boolean);

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  // Replace type usage
  src = src.replace(/Parameters<typeof db\.execute>\[0\]/g, 'SQL | SQLWrapper');
  if (src === original) continue;

  // Add SQL + SQLWrapper to drizzle-orm import.
  // STRICT: match a SINGLE LINE only. `[^}\n]+` ensures no newline inside the braces.
  const singleLineRe = /^(\s*)import\s*(type\s+)?\{([^}\n]+)\}\s*from\s*['"]drizzle-orm['"]\s*;?\s*$/m;
  const m = src.match(singleLineRe);
  if (m) {
    const items = m[3].split(',').map(s => s.trim()).filter(Boolean);
    let changed = false;
    if (!items.includes('SQL')) { items.push('SQL'); changed = true; }
    if (!items.includes('SQLWrapper')) { items.push('SQLWrapper'); changed = true; }
    if (changed) {
      items.sort();
      const typePrefix = m[2] ? 'type ' : '';
      src = src.replace(m[0], `${m[1]}import ${typePrefix}{ ${items.join(', ')} } from 'drizzle-orm';`);
    }
  } else {
    // Multi-line drizzle-orm import, or none. Try multi-line match.
    const multiRe = /^(\s*)import\s*(type\s+)?\{([\s\S]*?)\}\s*from\s*['"]drizzle-orm['"]\s*;?\s*$/m;
    const mm = src.match(multiRe);
    if (mm) {
      const items = mm[3].split(',').map(s => s.trim()).filter(Boolean);
      let changed = false;
      if (!items.includes('SQL')) { items.push('SQL'); changed = true; }
      if (!items.includes('SQLWrapper')) { items.push('SQLWrapper'); changed = true; }
      if (changed) {
        items.sort();
        const typePrefix = mm[2] ? 'type ' : '';
        src = src.replace(mm[0], `${mm[1]}import ${typePrefix}{ ${items.join(', ')} } from 'drizzle-orm';`);
      }
    } else {
      // No drizzle-orm import — add a new line right after the existing first import
      const firstImportRe = /^import\s.*?$/m;
      const fm = src.match(firstImportRe);
      if (fm) {
        src = src.replace(fm[0], `${fm[0]}\nimport type { SQL, SQLWrapper } from 'drizzle-orm';`);
      }
    }
  }

  if (src !== original) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed}/${files.length} files`);
