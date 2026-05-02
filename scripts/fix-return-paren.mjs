#!/usr/bin/env node
/**
 * fix-return-paren.mjs
 * Fixes `return (await X(` → `return await X(` in controller files.
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = join(ROOT, 'apps/api');

const tscOut = execSync('npx tsc --noEmit 2>&1 || true', { cwd: API, maxBuffer: 10*1024*1024 }).toString();

const errRe = /^(src\/.+?\.ts)\((\d+),\d+\): error TS1005: '\)' expected/gm;
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
  let content = readFileSync(absFile, 'utf8');
  const original = content;
  const lines = content.split('\n');

  for (const lineNum of lineNums) {
    const closeIdx = lineNum - 1; // The line with the ')' expected error

    // Look backwards to find the return (await line
    for (let i = closeIdx - 1; i >= Math.max(0, closeIdx - 15); i--) {
      if (/return \(await /.test(lines[i])) {
        // Fix this line: remove the extra (
        lines[i] = lines[i].replace('return (await ', 'return await ');
        totalFixed++;
        console.log(`  Fixed ${relFile}:${i + 1}`);
        break;
      }
    }
  }
  
  const newContent = lines.join('\n');
  if (newContent !== original) {
    writeFileSync(absFile, newContent, 'utf8');
  }
}

console.log(`\nTotal fixed: ${totalFixed}`);
