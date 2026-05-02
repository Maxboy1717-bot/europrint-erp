#!/usr/bin/env node
/**
 * Fix array safety — correct receiver-based approach.
 * Uses (receiver ?? []).method() for ALL cases.
 * Handles: simple vars, chained access, non-null assertions, inline literals.
 * 
 * Run on any directory: node scripts/fix-array-safety-all.mjs [dir]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const METHODS = ['map', 'filter', 'reduce', 'find', 'findIndex', 'forEach', 'some', 'every', 'flatMap', 'flat'];
const METHOD_PAT = METHODS.join('|');

const TARGET_DIRS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['artifacts/erp-dashboard/src', 'artifacts/europrint-site/src'];

function getAllFiles(dir) {
  const files = [];
  try {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      const stat = statSync(full);
      if (stat.isDirectory() && !f.includes('node_modules') && !f.includes('.spec.')) {
        files.push(...getAllFiles(full));
      } else if (stat.isFile() && (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.spec.ts')) {
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

/**
 * Given a string and the position of '.' in '.method(',
 * walk backwards to find the start of the receiver expression.
 * 
 * A receiver is a chain of identifiers connected by '.' or '?.', 
 * possibly with a trailing '!', e.g.:
 *   a.b.c  →  starts at 'a'
 *   a?.b   →  starts at 'a'
 *   items! →  starts at 'i'
 * 
 * Stops at: whitespace, =, +, -, *, /, %, (, {, [, ,, ;, <, >, |, &, !, :, ?
 * Exception: '.' and '?' are included when part of '.', '?.', '!.'
 */
function findReceiverStart(line, dotPos) {
  // dotPos = position of '.' in '.method('
  let i = dotPos - 1;

  while (i >= 0) {
    const ch = line[i];
    // Word characters (identifier chars)
    if (/[a-zA-Z0-9_$]/.test(ch)) {
      i--;
      continue;
    }
    // '!' for non-null assertion
    if (ch === '!') {
      i--;
      continue;
    }
    // '.' for chained access: include it
    if (ch === '.') {
      // Check if preceded by '?' (making it '?.')
      if (i > 0 && line[i - 1] === '?') {
        i -= 2; // skip both '?' and '.'
      } else {
        i--; // skip just '.'
      }
      continue;
    }
    // Stop at anything else
    break;
  }

  return i + 1; // start of receiver
}

/**
 * Make a receiver expression safe by converting plain '.' to '?.'
 * and removing trailing '!'
 */
function makeSafeReceiver(receiver) {
  // Remove trailing '!'
  let safe = receiver.replace(/!$/, '');
  // Replace plain dots with optional chaining dots
  // But don't replace dots that are already part of '?.'
  safe = safe.replace(/(?<!\?)\.(?!\?)/g, '?.');
  return safe;
}

/**
 * Fix one unsafe call in the line.
 * Returns the modified line or the original if no fix applied.
 */
function fixOnce(line, method) {
  if (!isUnsafeLine(line, method)) return line;

  // Case 1: Inline literal array [content].method( → ([content]).method(
  // The ]).method( exclusion covers this
  {
    const litPat = new RegExp(`(\\[[^\\n\\]]*\\])\\.${method}\\(`);
    const m = litPat.exec(line);
    if (m) {
      const candidate = line.slice(0, m.index) + `(${m[1]}).${method}(` + line.slice(m.index + m[0].length);
      if (!isUnsafeLine(candidate, method)) return candidate;
    }
  }

  // Case 2: Find the unsafe .method( and apply receiver-based fix
  // Scan all occurrences of .method( that could be unsafe
  const searchPat = new RegExp(`\\.${method}\\(`, 'g');
  let m;
  while ((m = searchPat.exec(line)) !== null) {
    const dotPos = m.index; // position of '.' in '.method('

    // Check if the char BEFORE this '.' is not '?', '.', or space (i.e., it's unsafe)
    if (dotPos === 0) continue;
    const prevChar = line[dotPos - 1];
    if (prevChar === '?' || prevChar === '.' || /\s/.test(prevChar)) continue;

    // Find the full receiver expression
    const recvStart = findReceiverStart(line, dotPos);
    const receiver = line.slice(recvStart, dotPos); // e.g., "node.children" or "prev" or "items!"

    if (!receiver) continue;

    // Build safe receiver
    const safeReceiver = makeSafeReceiver(receiver);

    // Build the candidate line
    const before = line.slice(0, recvStart);
    const after = line.slice(dotPos + 1 + method.length + 1); // after '.method('
    const candidate = `${before}(${safeReceiver} ?? []).${method}(${after}`;

    if (!isUnsafeLine(candidate, method)) return candidate;
  }

  return line;
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  let fixCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    if (/^\s*\/\//.test(original)) continue; // skip full-line comments

    let line = original;
    let madeProgress = true;
    let iterations = 0;

    while (madeProgress && iterations < 15) {
      madeProgress = false;
      for (const method of METHODS) {
        if (isUnsafeLine(line, method)) {
          const fixed = fixOnce(line, method);
          if (fixed !== line) {
            line = fixed;
            madeProgress = true;
            fixCount++;
          }
        }
      }
      iterations++;
    }

    if (line !== original) {
      lines[i] = line;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`  [${fixCount}] ${filePath.replace(process.cwd() + '/', '')}`);
    return fixCount;
  }
  return 0;
}

// Main
console.log(`Fixing array safety in: ${TARGET_DIRS.join(', ')}\n`);
let totalFixed = 0;
let filesFixed = 0;

for (const dir of TARGET_DIRS) {
  const files = getAllFiles(dir);
  for (const file of files) {
    const count = processFile(file);
    if (count > 0) {
      totalFixed += count;
      filesFixed++;
    }
  }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`Fixed ${totalFixed} unsafe calls in ${filesFixed} files`);
