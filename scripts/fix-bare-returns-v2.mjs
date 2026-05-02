#!/usr/bin/env node
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

const BARE_RE = /^(\s*)return\s+(await\s+this\.\w+\.\w+\()/;

let totalFixed = 0;
let totalFiles = 0;

for (const file of walkDir('apps/api/src')) {
  if (SKIP_FILE_PATTERNS.some(s => file.includes(s))) continue;

  const original = readFileSync(file, 'utf8');
  const lines = original.split('\n');
  let changed = false;

  const newLines = lines.map(line => {
    if (!BARE_RE.test(line)) return line;
    if (SKIP_LINE_PATTERNS.some(p => line.includes(p))) return line;
    const trimmed = line.trimEnd();
    if (!trimmed.endsWith(';')) return line;
    const m = line.match(/^(\s*)return\s+(await\s+this\..+);$/);
    if (!m) return line;
    changed = true;
    totalFixed++;
    return `${m[1]}return unwrapOrInternal(${m[2]});`;
  });

  const result = newLines.join('\n');
  if (changed) {
    writeFileSync(file, result, 'utf8');
    totalFiles++;
  }
}

console.log(`Fixed: ${totalFixed} lines in ${totalFiles} files`);
