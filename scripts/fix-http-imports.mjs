// Fix missing HttpException / HttpStatus imports in NestJS controllers.
// Pattern: file uses `HttpException` or `HttpStatus.` but doesn't import them
// from '@nestjs/common'. Add them to the existing @nestjs/common import.

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
let totalFixed = 0;

for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.warn(`SKIP (not found): ${file}`);
    continue;
  }
  let src = fs.readFileSync(abs, 'utf8');

  const usesException = /\bHttpException\s*\(/.test(src);
  const usesStatus    = /\bHttpStatus\.[A-Z_]/.test(src);
  if (!usesException && !usesStatus) {
    continue;
  }

  // Find existing import from '@nestjs/common'
  const importRe = /import\s*\{([\s\S]*?)\}\s*from\s*['"]@nestjs\/common['"]\s*;?/m;
  const match = src.match(importRe);

  const needAdd = [];
  if (usesException && !/\bHttpException\b/.test(match?.[1] ?? '')) needAdd.push('HttpException');
  if (usesStatus    && !/\bHttpStatus\b/.test(match?.[1] ?? ''))    needAdd.push('HttpStatus');

  if (needAdd.length === 0) continue;

  if (match) {
    const oldImport = match[0];
    const items = match[1].split(',').map(s => s.trim()).filter(Boolean);
    for (const sym of needAdd) {
      if (!items.includes(sym)) items.push(sym);
    }
    items.sort();
    const newImport = `import { ${items.join(', ')} } from '@nestjs/common';`;
    src = src.replace(oldImport, newImport);
  } else {
    // No existing import — add a fresh one at the top after the first comment block
    const newImport = `import { ${needAdd.join(', ')} } from '@nestjs/common';\n`;
    const insertAt = src.search(/^import\s/m);
    if (insertAt >= 0) {
      src = src.slice(0, insertAt) + newImport + src.slice(insertAt);
    } else {
      src = newImport + src;
    }
  }

  fs.writeFileSync(abs, src);
  console.log(`FIXED: ${file} (+${needAdd.join(', ')})`);
  totalFixed++;
}

console.log(`\nTotal fixed: ${totalFixed}/${files.length} files`);
