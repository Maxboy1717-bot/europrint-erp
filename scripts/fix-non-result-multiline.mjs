#!/usr/bin/env node
/**
 * fix-non-result-multiline.mjs
 * Fixes multi-line unwrapOrInternal() calls where the service returns raw data.
 * Removes unwrapOrInternal() wrapper from calls that TypeScript reports as TS2345.
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');

const tscOut = execSync('npx tsc --noEmit 2>&1 || true', { cwd: API, maxBuffer: 10*1024*1024 }).toString();

// Find all TS2345 "not assignable to...Result" errors 
const errRe = /^(src\/.+?\.ts)\((\d+),\d+\): error TS2345: .*not assignable to parameter of type 'Result</gm;
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
    if (idx >= lines.length) continue;
    const line = lines[idx];

    // Case 1: single line return unwrapOrInternal(await X);
    const singleLine = line.match(/^(\s*)return unwrapOrInternal\((await .+)\);(\s*)$/);
    if (singleLine) {
      lines[idx] = `${singleLine[1]}return ${singleLine[2]};${singleLine[3]}`;
      changed = true;
      totalFixed++;
      console.log(`  Single-line fixed ${relFile}:${lineNum}`);
      continue;
    }

    // Case 2: return unwrapOrInternal( starts here (multi-line)
    const multiStart = line.match(/^(\s*)return unwrapOrInternal\((await .*)?$/);
    if (multiStart) {
      // This line starts with `return unwrapOrInternal(`
      // Find the matching closing `));` 
      let depth = 1; // We're inside unwrapOrInternal(
      let endIdx = idx;
      
      for (let j = idx; j < Math.min(idx + 20, lines.length); j++) {
        const scanLine = j === idx ? line.slice(line.indexOf('(') + 1) : lines[j];
        for (const ch of scanLine) {
          if (ch === '(') depth++;
          if (ch === ')') {
            depth--;
            if (depth === 0) { endIdx = j; break; }
          }
        }
        if (depth === 0) break;
      }
      
      if (depth !== 0) {
        console.log(`  Could not find closing paren for ${relFile}:${lineNum}`);
        continue;
      }
      
      // The opening line: replace `return unwrapOrInternal(` with `return (`
      // (or just remove the unwrapOrInternal wrapper)
      lines[idx] = line.replace(/return unwrapOrInternal\(/, 'return (');
      
      // The closing line: remove the extra `)` from `));` → `);`  
      const closingLine = lines[endIdx];
      // Find the last ));  pattern
      if (/\)\);/.test(closingLine)) {
        lines[endIdx] = closingLine.replace(/\)\);(\s*)$/, ');$1');
        changed = true;
        totalFixed++;
        console.log(`  Multi-line fixed ${relFile}:${lineNum}-${endIdx + 1}`);
      } else if (/\)\)/.test(closingLine)) {
        lines[endIdx] = closingLine.replace(/\)\)/, ')');
        changed = true;
        totalFixed++;
        console.log(`  Multi-line fixed ${relFile}:${lineNum}-${endIdx + 1}`);
      }
    }
  }
  
  if (changed) {
    writeFileSync(absFile, lines.join('\n'), 'utf8');
  }
}

console.log(`\nTotal fixed: ${totalFixed}`);
