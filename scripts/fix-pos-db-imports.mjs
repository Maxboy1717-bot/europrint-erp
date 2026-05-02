#!/usr/bin/env node
/**
 * fix-pos-db-imports.mjs
 * For POS files: revert 'db' import from '@shared/db' back to '@workspace/db'
 * so that both db and schema tables use the same drizzle-orm instance.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');

// Find all TS files with cross-instance errors (TS2345 PgTableWithColumns)
const tscOut = execSync('npx tsc --noEmit 2>&1 || true', { cwd: API, maxBuffer: 10*1024*1024 }).toString();
const errRe = /^(src\/.+?\.ts)\(\d+,\d+\): error TS2345: Argument of type 'PgTableWithColumns/gm;
const matches = [...tscOut.matchAll(errRe)];
const badFiles = new Set(matches.map(m => join(API, m[1])));

// Also fix any file that has both @shared/db (for db) and @workspace/db (for tables)
// These will have cross-instance conflicts
const allPosFiles = execSync(`grep -rl "@shared/db" ${API}/src/modules/pos/ 2>/dev/null || true`, { maxBuffer: 1024*1024 }).toString().trim().split('\n').filter(Boolean);

const filesToFix = new Set([...badFiles, ...allPosFiles]);

console.log(`Files to check: ${filesToFix.size}`);

let totalFixed = 0;
for (const absFile of filesToFix) {
  let content = readFileSync(absFile, 'utf8');
  const original = content;

  // If file imports db from @shared/db AND has @workspace/db imports,
  // consolidate db into @workspace/db
  const hasSharedDb = /from '@shared\/db'/.test(content);
  const hasWorkspaceDb = /from '@workspace\/db'/.test(content);

  if (hasSharedDb && hasWorkspaceDb) {
    // Extract what's imported from @shared/db
    const sharedDbImports = [];
    content = content.replace(
      /^import \{ ([^}]+) \} from '@shared\/db';\n?/gm,
      (match, names) => {
        const ns = names.split(',').map(n => n.trim()).filter(Boolean);
        sharedDbImports.push(...ns);
        return ''; // Remove the @shared/db import line
      }
    );

    // Remove db-related names from @workspace/db imports if they're already there
    const dbRelated = sharedDbImports.filter(n => !['db', 'runQuery', 'rawSql', 'ddlRun'].includes(n));

    // Add db/runQuery to existing @workspace/db import
    content = content.replace(
      /^import \{ ([^}]+) \} from '@workspace\/db';/m,
      (match, names) => {
        const existing = names.split(',').map(n => n.trim()).filter(Boolean);
        const toAdd = sharedDbImports.filter(n => !existing.includes(n));
        if (toAdd.length === 0) return match;
        return `import { ${[...existing, ...toAdd].join(', ')} } from '@workspace/db';`;
      }
    );

    if (content !== original) {
      writeFileSync(absFile, content, 'utf8');
      totalFixed++;
      console.log(`  Fixed: ${absFile.replace(API + '/', '')}`);
    }
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
