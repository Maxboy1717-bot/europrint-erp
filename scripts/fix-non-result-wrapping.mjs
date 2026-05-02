#!/usr/bin/env node
/**
 * fix-non-result-wrapping.mjs
 * Finds TS2345 errors "not assignable to Result<unknown>" and reverts
 * those specific lines from `return unwrapOrInternal(...)` back to `return ...`
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');

console.log('Running tsc to find TS2345 errors...');
const tscOut = execSync('npx tsc --noEmit 2>&1 || true', { cwd: API, maxBuffer: 10*1024*1024 }).toString();

// Parse lines like: src/modules/pos/controllers/barcode.controller.ts(46,29): error TS2345: ...Result<unknown>
const errRe = /^(src\/.+?\.ts)\((\d+),\d+\): error TS2345: .*Result<unknown>/gm;
const matches = [...tscOut.matchAll(errRe)];

const byFile = {};
for (const m of matches) {
  const file = m[1];
  const line = parseInt(m[2], 10);
  if (!byFile[file]) byFile[file] = new Set();
  byFile[file].add(line);
}

let totalFixed = 0;
for (const [relFile, lineNums] of Object.entries(byFile)) {
  const absFile = join(API, relFile);
  const content = readFileSync(absFile, 'utf8');
  const lines = content.split('\n');
  let changed = false;

  for (const lineNum of lineNums) {
    const idx = lineNum - 1;
    const line = lines[idx];
    if (!line) continue;

    // Pattern: return unwrapOrInternal(await service.x(args));
    // We need to remove the unwrapOrInternal() wrapper
    const wrapped = line.match(/^(\s*)return unwrapOrInternal\((await .+)\);(\s*)$/);
    if (wrapped) {
      lines[idx] = `${wrapped[1]}return ${wrapped[2]};${wrapped[3]}`;
      changed = true;
      totalFixed++;
      console.log(`  Fixed ${relFile}:${lineNum}`);
    } else {
      // Maybe it spans multiple lines due to multiline arg
      // Check if line contains just unwrapOrInternal( and next line has the actual call
      const partialWrapped = line.match(/^(\s*)return unwrapOrInternal\($/);
      if (partialWrapped) {
        // Remove this line (the unwrapOrInternal( line)
        lines[idx] = `${partialWrapped[1]}return (`;
        // Find closing );  which is one of the next few lines with just );
        for (let j = idx + 1; j < Math.min(idx + 5, lines.length); j++) {
          if (/^\s*\);\s*$/.test(lines[j])) {
            lines[j] = `${partialWrapped[1]}`;
            break;
          }
        }
        changed = true;
        totalFixed++;
        console.log(`  Fixed multiline ${relFile}:${lineNum}`);
      }
    }
  }
  if (changed) {
    writeFileSync(absFile, lines.join('\n'), 'utf8');
  }
}

console.log(`\nTotal fixed: ${totalFixed}`);
