#!/usr/bin/env node
/**
 * Wraps multi-line `return await this.X.Y(` with `unwrapOrInternal(...)`.
 * Tracks parenthesis depth to find the matching closing paren+semicolon.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SKIP_FILE_PATTERNS = ['wms-warehouse-gateway', 'qc-inspections'];
const SKIP_LINE_PATTERNS = [
  'unwrapOrThrow', 'unwrapOrInternal', 'unwrapOrBadRequest', 'unwrapOrNotFound',
  'commandBus', 'queryBus', 'eventBus', '//',
];

function* walkDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walkDir(full);
    else if (full.endsWith('.controller.ts') && !full.endsWith('.spec.ts')) yield full;
  }
}

const BARE_MULTI_RE = /^(\s*)return\s+(await\s+this\.\w+\.\w+\()/;

let totalFixed = 0;
let totalFiles = 0;

for (const file of walkDir('apps/api/src')) {
  if (SKIP_FILE_PATTERNS.some(s => file.includes(s))) continue;

  const original = readFileSync(file, 'utf8');
  const lines = original.split('\n');
  let changed = false;
  const newLines = [...lines];

  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i];
    if (!BARE_MULTI_RE.test(line)) continue;
    if (SKIP_LINE_PATTERNS.some(p => line.includes(p))) continue;
    const trimmed = line.trimEnd();
    if (trimmed.endsWith(';')) continue; // single-line, already handled

    // Multi-line: find end of expression by tracking parens
    const m = line.match(/^(\s*)return\s+(await\s+this\..+)$/);
    if (!m) continue;

    // Count open parens on this line
    let depth = 0;
    for (const ch of line) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
    }

    // Find the closing line
    let endLine = -1;
    for (let j = i + 1; j < newLines.length && j < i + 30; j++) {
      const jLine = newLines[j];
      for (const ch of jLine) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      if (depth <= 0) {
        // This line has the closing paren+semicolon
        const jTrimmed = newLines[j].trimEnd();
        if (jTrimmed.endsWith(');')) {
          endLine = j;
          break;
        }
      }
    }

    if (endLine === -1) continue; // can't find closing line safely

    // Wrap opening line
    newLines[i] = line.replace(
      /^(\s*)return\s+(await\s+this\.)/,
      (_, indent, rest) => `${indent}return unwrapOrInternal(${rest}`
    );
    // Fix closing line: replace final `);` with `));`
    newLines[endLine] = newLines[endLine].replace(/\);\s*$/, '));');

    changed = true;
    totalFixed++;
    i = endLine; // skip processed lines
  }

  if (changed) {
    writeFileSync(file, newLines.join('\n'), 'utf8');
    totalFiles++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nFixed: ${totalFixed} multi-line returns in ${totalFiles} files`);
