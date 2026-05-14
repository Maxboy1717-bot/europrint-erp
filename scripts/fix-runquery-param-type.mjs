// Replace `Parameters<typeof db.execute>[0]` (which is `string | SQL | SQLWrapper`)
// with `SQL | SQLWrapper`, because runQuery() no longer accepts strings (security fix).
// Also ensure SQL + SQLWrapper are imported from drizzle-orm.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve('apps/api/src');
const files = execSync(
  `grep -rl "Parameters<typeof db\\.execute>\\[0\\]" "${root}"`,
  { encoding: 'utf8' },
).split('\n').filter(Boolean);

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('Parameters<typeof db.execute>[0]')) continue;

  const before = src;
  src = src.replace(/Parameters<typeof db\.execute>\[0\]/g, 'SQL | SQLWrapper');

  // Ensure drizzle-orm imports include SQL and SQLWrapper
  const drizzleImportRe = /import\s*\{([\s\S]*?)\}\s*from\s*['"]drizzle-orm['"]\s*;?/m;
  const m = src.match(drizzleImportRe);
  if (m) {
    const items = m[1].split(',').map(s => s.trim()).filter(Boolean);
    let changed = false;
    if (!items.includes('SQL')) { items.push('SQL'); changed = true; }
    if (!items.includes('SQLWrapper')) { items.push('SQLWrapper'); changed = true; }
    if (changed) {
      items.sort();
      src = src.replace(m[0], `import { ${items.join(', ')} } from 'drizzle-orm';`);
    }
  } else {
    // No drizzle-orm import — add one
    const insertAt = src.search(/^import\s/m);
    const newImport = `import type { SQL, SQLWrapper } from 'drizzle-orm';\n`;
    if (insertAt >= 0) {
      src = src.slice(0, insertAt) + newImport + src.slice(insertAt);
    } else {
      src = newImport + src;
    }
  }

  if (src !== before) {
    fs.writeFileSync(file, src);
    fixed++;
  }
}

console.log(`Fixed ${fixed}/${files.length} files`);
