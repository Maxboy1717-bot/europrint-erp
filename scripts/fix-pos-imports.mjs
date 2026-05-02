#!/usr/bin/env node
/**
 * fix-pos-imports.mjs
 * Fixes @workspace/db imports that incorrectly import drizzle-orm helpers.
 * In apps/api, the compiled @workspace/db doesn't export eq, and, sql, etc.
 * Fix: import drizzle-orm helpers from 'drizzle-orm', db from '@shared/db',
 * and schema tables from '@workspace/db'.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');

// These are drizzle-orm exports that should come from 'drizzle-orm', not '@workspace/db'
const DRIZZLE_HELPERS = new Set([
  'sql', 'eq', 'ne', 'and', 'or', 'not', 'gt', 'gte', 'lt', 'lte',
  'isNull', 'isNotNull', 'inArray', 'notInArray', 'exists', 'notExists',
  'between', 'notBetween', 'like', 'ilike', 'notIlike', 'desc', 'asc',
  'count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'unionAll', 'union',
  'intersect', 'except', 'alias', 'getTableColumns', 'getTableName',
]);

// Find all TS files with TS2305 errors from @workspace/db
const tscOut = execSync('npx tsc --noEmit 2>&1 || true', { cwd: API, maxBuffer: 10*1024*1024 }).toString();
const errRe = /^(src\/.+?\.ts)\(\d+,\d+\): error TS2305: Module '"@workspace\/db"' has no exported member '(\w+)'/gm;
const matches = [...tscOut.matchAll(errRe)];
const badFiles = new Set(matches.map(m => join(API, m[1])));

console.log(`Files to fix: ${badFiles.size}`);

let totalFixed = 0;
for (const absFile of badFiles) {
  let content = readFileSync(absFile, 'utf8');
  const original = content;

  // Process @workspace/db import lines
  // Pattern: import { x, y, z } from '@workspace/db';
  content = content.replace(
    /^(import\s*\{)([^}]+)(\}\s*from\s*'@workspace\/db';)/gm,
    (match, open, names, close) => {
      const allNames = names.split(',').map(n => n.trim()).filter(Boolean);
      const helpers = allNames.filter(n => DRIZZLE_HELPERS.has(n));
      const rest = allNames.filter(n => !DRIZZLE_HELPERS.has(n));

      let result = '';
      if (rest.length > 0) {
        if (rest.length === 1) {
          result += `import { ${rest[0]} } from '@workspace/db';`;
        } else {
          result += `import { ${rest.join(', ')} } from '@workspace/db';`;
        }
      }
      if (helpers.length > 0) {
        if (result) result += '\n';
        result += `import { ${helpers.join(', ')} } from 'drizzle-orm';`;
      }
      if (!result) result = match; // unchanged
      return result;
    }
  );

  // Also fix cases where 'db' is imported from '@workspace/db' - should use '@shared/db'
  content = content.replace(
    /^(import\s*\{)([^}]+)(\}\s*from\s*'@workspace\/db';)/gm,
    (match, open, names, close) => {
      const allNames = names.split(',').map(n => n.trim()).filter(Boolean);
      if (allNames.includes('db') || allNames.includes('runQuery')) {
        const dbNames = allNames.filter(n => n === 'db' || n === 'runQuery' || n === 'rawSql' || n === 'ddlRun');
        const schemaNames = allNames.filter(n => !dbNames.includes(n));
        
        let result = '';
        if (dbNames.length > 0) {
          result += `import { ${dbNames.join(', ')} } from '@shared/db';`;
        }
        if (schemaNames.length > 0) {
          if (result) result += '\n';
          result += `import { ${schemaNames.join(', ')} } from '@workspace/db';`;
        }
        return result || match;
      }
      return match;
    }
  );

  if (content !== original) {
    writeFileSync(absFile, content, 'utf8');
    totalFixed++;
    console.log(`  Fixed: ${absFile.replace(API + '/', '')}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
