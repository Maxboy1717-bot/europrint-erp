#!/usr/bin/env node
/**
 * consolidate-pos-imports.mjs
 * Now that @workspace/db → lib/db/src/index.ts (which exports db, eq, sql, and schema tables),
 * consolidate all POS file imports to use @workspace/db for everything.
 * Also removes duplicate @shared/db imports that conflict with @workspace/db.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');

// These are drizzle-orm exports that @workspace/db also exports
const DRIZZLE_HELPERS = new Set([
  'sql', 'eq', 'ne', 'and', 'or', 'not', 'gt', 'gte', 'lt', 'lte',
  'isNull', 'isNotNull', 'inArray', 'notInArray', 'exists', 'notExists',
  'between', 'notBetween', 'like', 'ilike', 'notIlike', 'desc', 'asc',
  'count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'unionAll', 'union',
  'intersect', 'except', 'alias', 'getTableColumns', 'getTableName',
]);

// Find POS files that have mixed imports
const posFiles = execSync(
  `find ${API}/src/modules/pos -name "*.ts" 2>/dev/null | head -200`,
  { maxBuffer: 1024*1024 }
).toString().trim().split('\n').filter(Boolean);

console.log(`POS files to process: ${posFiles.length}`);

let totalFixed = 0;
for (const absFile of posFiles) {
  let content = readFileSync(absFile, 'utf8');
  const original = content;

  // Collect all drizzle-orm imports from 'drizzle-orm' and move them to @workspace/db
  const drizzleImports = new Set();
  content = content.replace(
    /^import \{ ([^}]+) \} from 'drizzle-orm';\n?/gm,
    (match, names) => {
      const ns = names.split(',').map(n => n.trim()).filter(n => DRIZZLE_HELPERS.has(n));
      const nonHelpers = names.split(',').map(n => n.trim()).filter(n => !DRIZZLE_HELPERS.has(n));
      ns.forEach(n => drizzleImports.add(n));
      if (nonHelpers.length > 0) {
        return `import { ${nonHelpers.join(', ')} } from 'drizzle-orm';\n`;
      }
      return ''; // Remove the line
    }
  );

  // If we collected some drizzle imports, add them to @workspace/db import
  if (drizzleImports.size > 0) {
    // Try to append to existing @workspace/db import
    let addedToExisting = false;
    content = content.replace(
      /^import \{ ([^}]+) \} from '@workspace\/db';/m,
      (match, names) => {
        const existing = names.split(',').map(n => n.trim()).filter(Boolean);
        const toAdd = [...drizzleImports].filter(n => !existing.includes(n));
        if (toAdd.length === 0) {
          addedToExisting = true;
          return match;
        }
        addedToExisting = true;
        return `import { ${[...existing, ...toAdd].join(', ')} } from '@workspace/db';`;
      }
    );

    // If no @workspace/db import exists, add one
    if (!addedToExisting) {
      // Find the first import line and add after
      content = `import { ${[...drizzleImports].join(', ')} } from '@workspace/db';\n` + content;
    }
  }

  // Remove @shared/db for db if @workspace/db already exports db
  // Only if the file also has @workspace/db imports (to avoid breaking non-POS files)
  const hasWorkspaceDb = /from '@workspace\/db'/.test(content);
  if (hasWorkspaceDb) {
    content = content.replace(
      /^import \{ db(?:, runQuery)? \} from '@shared\/db';\n?/gm,
      ''
    );
    // If @shared/db import had db in it with other things, keep other things
    content = content.replace(
      /^import \{ ([^}]+), db \} from '@shared\/db';/gm,
      (match, rest) => `import { ${rest} } from '@shared/db';`
    );
    content = content.replace(
      /^import \{ db, ([^}]+) \} from '@shared\/db';/gm,
      (match, rest) => `import { ${rest} } from '@shared/db';`
    );
  }

  if (content !== original) {
    writeFileSync(absFile, content, 'utf8');
    totalFixed++;
    console.log(`  Fixed: ${absFile.replace(API + '/', '')}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
