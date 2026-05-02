#!/usr/bin/env node
/**
 * Fix non-async controller methods that use `return await`.
 * Walk backward from each `return await` line to find the enclosing method.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function findFiles(dir, pattern, results = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      findFiles(full, pattern, results);
    } else if (pattern.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = findFiles('apps/api/src', /\.controller\.ts$/);
let totalFixed = 0;
let filesFixed = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  const fixedLines = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    if (!/\breturn await\b/.test(lines[i])) continue;
    
    // Walk backward to find the enclosing method's opening `{`
    let braceDepth = 0;
    let openingBraceLineIdx = -1;
    
    for (let j = i - 1; j >= Math.max(0, i - 100); j--) {
      const l = lines[j];
      // Count braces in reverse
      for (let k = l.length - 1; k >= 0; k--) {
        if (l[k] === '}') braceDepth++;
        else if (l[k] === '{') {
          braceDepth--;
          if (braceDepth < 0) {
            openingBraceLineIdx = j;
            break;
          }
        }
      }
      if (openingBraceLineIdx >= 0) break;
    }
    
    if (openingBraceLineIdx < 0) continue;
    
    // Now scan backward from openingBraceLineIdx to find the method name
    // Skip parameter lines (@ decorators at 4+ spaces)
    // Stop at class-level decorators (@ at 2 spaces) or class declaration
    let methodLineIdx = -1;
    for (let j = openingBraceLineIdx; j >= Math.max(0, openingBraceLineIdx - 15); j--) {
      const ml = lines[j];
      
      // Method declaration: exactly 2 spaces + identifier + optional whitespace + (
      // e.g. "  getAccounts(" or "  listSuggestions("
      if (/^  [a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(ml) &&
          !ml.includes('async ') &&
          !ml.includes('constructor') &&
          !ml.startsWith('  //')) {
        methodLineIdx = j;
        break;
      }
      
      // Stop at class-level decorators (2-space indent @) — method HTTP decorators
      // These indicate the start of a new method block above our target
      if (/^  @[A-Za-z]/.test(ml)) {
        // But this decorator belongs to a method — the method we're looking for
        // is right after this decorator. So we need to look between this decorator
        // and the opening brace we found.
        // Actually if we hit a decorator, there's no matching method above this line.
        break;
      }
      
      // Stop at class declaration  
      if (/^\s*(class|export class)\b/.test(ml)) break;
    }
    
    if (methodLineIdx >= 0 && !fixedLines.has(methodLineIdx)) {
      lines[methodLineIdx] = lines[methodLineIdx].replace(
        /^(  )([a-zA-Z_][a-zA-Z0-9_]*)(\s*\()/,
        '$1async $2$3'
      );
      fixedLines.add(methodLineIdx);
      changed = true;
      totalFixed++;
      // Don't print too much
    }
  }
  
  if (changed) {
    writeFileSync(file, lines.join('\n'));
    filesFixed++;
    console.log(`Fixed ${fixedLines.size} methods in: ${file}`);
  }
}

console.log(`\nDone: ${totalFixed} methods fixed across ${filesFixed} files`);
