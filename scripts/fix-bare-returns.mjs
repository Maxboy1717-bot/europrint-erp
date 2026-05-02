#!/usr/bin/env node
/**
 * Fix bare `return await this.svc.*` in controller files
 * → wrap with unwrapOrInternal(await this.svc.*)
 * Skip: commandBus, queryBus, eventBus (these don't return Result<T>)
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const SKIP_PATTERNS = ['commandBus', 'queryBus', 'eventBus', 'unwrapOrThrow', 'unwrapOrInternal', 'unwrapOrBadRequest', 'unwrapOrNotFound'];

function needsUnwrap(line) {
  if (!line.match(/^\s*return await this\./)) return false;
  for (const p of SKIP_PATTERNS) {
    if (line.includes(p)) return false;
  }
  return true;
}

function fixFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let changed = false;
  let needsImport = false;

  const result = lines.map(line => {
    if (!needsUnwrap(line)) return line;
    needsImport = true;
    changed = true;
    return line.replace(/^(\s*)return (await this\..+?);?\s*$/, (_, indent, expr) => {
      const inner = expr.trimEnd().replace(/;$/, '');
      return `${indent}return unwrapOrInternal(${inner});`;
    });
  });

  if (!changed) return false;

  let output = result.join('\n');

  if (needsImport && !output.includes('unwrapOrInternal')) {
    if (output.includes("from '@common/http-result'")) {
      output = output.replace(
        /import\s*\{([^}]+)\}\s*from\s*'@common\/http-result'/,
        (m, imports) => {
          if (imports.includes('unwrapOrInternal')) return m;
          return `import { ${imports.trim()}, unwrapOrInternal } from '@common/http-result'`;
        }
      );
    } else {
      const linesArr = output.split('\n');
      const lastImportIdx = linesArr.reduce((acc, l, i) => l.startsWith('import ') ? i : acc, -1);
      if (lastImportIdx >= 0) {
        linesArr.splice(lastImportIdx + 1, 0, "import { unwrapOrInternal } from '@common/http-result';");
        output = linesArr.join('\n');
      }
    }
  }

  writeFileSync(filePath, output, 'utf8');
  return true;
}

const grep = execSync(
  `grep -rl "^\\s*return await this\\." apps/api/src/modules/ --include="*.controller.ts" 2>/dev/null || true`,
  { encoding: 'utf8' }
);

const files = grep.trim().split('\n').filter(f => f.trim());
let fixed = 0;

for (const f of files) {
  if (fixFile(f.trim())) {
    console.log(`Fixed: ${f.split('/').slice(-2).join('/')}`);
    fixed++;
  }
}

console.log(`\nTotal files fixed: ${fixed}`);
