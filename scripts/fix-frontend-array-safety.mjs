#!/usr/bin/env node
/**
 * Fix frontend array safety - Task #460
 * 
 * Two-pass approach:
 * PASS 1: Repair broken patterns from previous run (obj.(prop ?? []).method → obj.prop?.method)
 * PASS 2: Fix remaining unsafe calls using ?. optional chaining
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

/**
 * PASS 1: Repair broken patterns from previous run.
 * Pattern: ANYTHING.(PROP ?? []).METHOD( → ANYTHING.PROP?.METHOD(
 */
function repairBrokenPatterns(line) {
  let result = line;
  const idPat = '[a-zA-Z_$][a-zA-Z0-9_$]*';
  const methodAlt = METHOD_PAT;

  // Case A: word.(prop ?? []).method( → word.prop?.method(
  // Matches: identifier .(prop ?? []).method(
  {
    const pat = new RegExp(
      `\\b(${idPat})\\s*\\.\\s*\\((${idPat}) \\?\\? \\[\\]\\)\\.(${methodAlt})\\(`,
      'g'
    );
    result = result.replace(pat, (_, obj, prop, method) => `${obj}.${prop}?.${method}(`);
  }

  // Case B: ).(prop ?? []).method( → ).prop?.method(
  // For cases like: (item.data as Comment).(attachments ?? []).map(
  {
    const pat = new RegExp(
      `\\)\\s*\\.\\s*\\((${idPat}) \\?\\? \\[\\]\\)\\.(${methodAlt})\\(`,
      'g'
    );
    result = result.replace(pat, (_, prop, method) => `).${prop}?.${method}(`);
  }

  // Case C: ].(prop ?? []).method( → ].prop?.method(
  {
    const pat = new RegExp(
      `\\]\\s*\\.\\s*\\((${idPat}) \\?\\? \\[\\]\\)\\.(${methodAlt})\\(`,
      'g'
    );
    result = result.replace(pat, (_, prop, method) => `].${prop}?.${method}(`);
  }

  return result;
}

/**
 * PASS 2: Fix remaining unsafe calls.
 * Strategy A: Inline literal arrays [content].method( → ([content]).method(
 * Strategy B: Add ?. before .method( → X.method( → X?.method(
 */
function fixOnce(line, method) {
  // Fix A: Inline literal array [content].method( → ([content]).method(
  {
    const litPat = new RegExp(`(\\[[^\\n\\]]+\\])\\.${method}\\(`);
    if (litPat.test(line)) {
      const candidate = line.replace(litPat, `($1).${method}(`);
      if (!isUnsafeLine(candidate, method)) return candidate;
    }
  }

  // Fix B: Add ? before the final .method( by inserting ? before the dot
  // Regex: find a char that is not ?, ., whitespace followed by .method(
  // We insert ? after that char, before the dot
  {
    const pat = new RegExp(`([^?.\\s])(\\.${method}\\()`, 'g');
    let m;
    while ((m = pat.exec(line)) !== null) {
      const pos = m.index + 1; // position of the '.' in the match
      const candidate = line.substring(0, pos) + '?' + line.substring(pos);
      if (!isUnsafeLine(candidate, method)) return candidate;
    }
  }

  return line;
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  let repairCount = 0;
  let fixCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    if (/^\s*\/\//.test(original)) continue;

    let line = original;

    // PASS 1: Repair broken patterns
    const repaired = repairBrokenPatterns(line);
    if (repaired !== line) {
      line = repaired;
      repairCount++;
    }

    // PASS 2: Fix remaining unsafe calls
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
    const total = repairCount + fixCount;
    writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`  [r:${repairCount} f:${fixCount}] ${filePath.replace('/home/runner/workspace/', '')}`);
    return total;
  }

  return 0;
}

console.log('Fixing frontend array safety...\n');
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
console.log(`Total changes in ${filesFixed} files: ${totalFixed}`);
