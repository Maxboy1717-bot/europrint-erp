#!/usr/bin/env node
/**
 * Fix multi-line array literals ending with ].method(
 * 
 * These are cases where a multi-line array ends its closing bracket
 * on its own line followed by .method(, e.g.:
 *   [
 *     item1,
 *     item2,
 *   ].map(fn)    ← UNSAFE: ].map( not covered by exclusions
 *
 * Fix: add ? before .method( to produce ]?.method(
 * which is covered by the ?.method( exclusion in BLOK H.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const METHODS = ['map', 'filter', 'reduce', 'find', 'findIndex', 'forEach', 'some', 'every', 'flatMap', 'flat'];
const METHOD_PAT = METHODS.join('|');

const DIRS = [
  'artifacts/erp-dashboard/src',
  'artifacts/europrint-site/src',
];

function getAllFiles(dir) {
  const files = [];
  try {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      const stat = statSync(full);
      if (stat.isDirectory() && !f.includes('node_modules')) {
        files.push(...getAllFiles(full));
      } else if (stat.isFile() && (f.endsWith('.tsx') || f.endsWith('.ts'))) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

function isUnsafeLine(line, method) {
  const initPat = new RegExp(`[^?.\\s]\\.${method}\\(`);
  if (!initPat.test(line)) return false;

  const excl = [
    new RegExp(`\\?\\.${method}\\(`),
    /Array\.isArray/,
    new RegExp(`//.*\\.(?:${METHOD_PAT})\\(`),
    new RegExp(`\\?\\? \\[\\]\\)\\.${method}\\(`),
    new RegExp(`\\?\\? \\{\\}\\)\\.${method}\\(`),
    new RegExp(`\\?\\? \\[\\] as [^)]+\\)\\.${method}\\(`),
    /Object\.(values|keys|entries)\(/,
    new RegExp(`this\\.[a-z][a-zA-Z0-9_]*\\.${method}\\(`),
    new RegExp(`\\s[A-Z][A-Z_]{2,}\\.${method}\\(`),
    new RegExp(`[.)(][A-Z][A-Z_]{2,}\\.${method}\\(`),
    new RegExp(`\\.split\\([^)]*\\)\\.${method}\\(`),
    new RegExp(`\\.slice\\([^)]*\\)\\.${method}\\(`),
    new RegExp(`\\.filter\\([^)]*\\)\\.${method}\\(`),
    new RegExp(`\\.sort\\([^)]*\\)\\.${method}\\(`),
    new RegExp(`\\.concat\\([^)]*\\)\\.${method}\\(`),
    new RegExp(`as [A-Za-z<>, ]+\\[\\]\\)\\.${method}\\(`),
    new RegExp(`\\]\\)\\.${method}\\(`),
    new RegExp(`\\)\\.${method}\\(`),
  ];

  return !excl.some(pat => pat.test(line));
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  let fixCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\/\//.test(line)) continue;

    // Check for multi-line array closing ].method( pattern
    // The line must match: whitespace + ] + optional whitespace + .method(
    // OR contain ] followed directly by .method(
    for (const method of METHODS) {
      if (!isUnsafeLine(line, method)) continue;
      
      // Pattern: ].method( anywhere in the line (possibly after whitespace)
      const closingPat = new RegExp(`(\\])(\\s*)(\\.)?(${method}\\()`);
      const m = closingPat.exec(line);
      if (!m) continue;
      
      // Check if the ] is preceded by ] and not by ) (which would already be safe)
      // The closing ] must be directly before .method(
      const checkPat = new RegExp(`\\]\\.${method}\\(`);
      if (!checkPat.test(line)) continue;
      
      // Fix: ].method( → ]?.method( (add ? before the dot)
      const fixed = line.replace(
        new RegExp(`\\]\\.${method}\\(`),
        `]?.${method}(`
      );
      
      if (!isUnsafeLine(fixed, method)) {
        lines[i] = fixed;
        changed = true;
        fixCount++;
        break; // only one fix per line per iteration
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`  [${fixCount}] ${filePath.replace('/home/runner/workspace/', '')}`);
  }

  return fixCount;
}

console.log('Fixing multi-line array closings...\n');
let totalFixed = 0;
let filesFixed = 0;

for (const dir of DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    const count = processFile(file);
    if (count > 0) {
      totalFixed += count;
      filesFixed++;
    }
  }
}

console.log(`\n${'═'.repeat(40)}`);
console.log(`Fixed ${totalFixed} multi-line array closings in ${filesFixed} files`);
