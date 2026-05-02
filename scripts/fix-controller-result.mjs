#!/usr/bin/env node
/**
 * EuroPrint ERP — Controller Result Pattern Fixer
 * "return this.svc.method()" ni "return await this.svc.method()" ga o'tkazadi
 * Va metodni async qiladi agar bo'lmasa
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const DRY_RUN = process.argv.includes('--dry-run');
let totalFixed = 0;
let totalFiles = 0;

function fixControllerFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  let content = original;
  let changed = false;

  // Step 1: Fix "return this.svc.method(" -> "return await this.svc.method("
  // Pattern: whitespace + "return this." + identifier + "." + identifier + "("
  // NOT already having "await this." or ".getValue("
  const returnThisPattern = /^(\s+)(return\s+)(this\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\()/gm;
  
  const newContent = content.replace(returnThisPattern, (match, indent, returnKw, thisCall) => {
    // Skip if line has getValue or await already
    if (match.includes('.getValue(') || match.includes('await ')) {
      return match;
    }
    return `${indent}${returnKw}await ${thisCall}`;
  });
  
  if (newContent !== content) {
    content = newContent;
    changed = true;
  }

  // Step 2: Make methods async if they now use await but aren't async
  // Find methods that have "return await" but method def doesn't have "async"
  // Pattern: find non-async methods that contain "return await this."
  // This is complex - we'll use a line-by-line approach
  const lines = content.split('\n');
  const resultLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this is a method definition line (NOT already async)
    // Pattern: "  methodName(" or "  @Decorator\n  methodName("
    // We look for: indented non-async method followed by body containing "return await this."
    const methodMatch = line.match(/^(\s{2,})((?:@\w[^\n]*\n\s*)*)((?:public|private|protected|readonly|override)\s+)*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    
    if (methodMatch && !line.includes('async ') && !line.includes('//') && !line.startsWith('//')) {
      // Look ahead to find the method body
      let depth = 0;
      let bodyStart = i;
      let bodyEnd = i;
      let hasAwaitThis = false;
      
      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        const l = lines[j];
        depth += (l.match(/\{/g) || []).length;
        depth -= (l.match(/\}/g) || []).length;
        
        if (j > i && l.includes('return await this.')) {
          hasAwaitThis = true;
        }
        
        if (j > i && depth <= 0) {
          bodyEnd = j;
          break;
        }
      }
      
      if (hasAwaitThis) {
        // Add async to the method definition
        const asyncFixed = line.replace(
          /^(\s+)((?:public|private|protected|override|readonly)\s+)*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
          (m, indent, modifiers, methodName) => {
            if (modifiers) {
              return `${indent}${modifiers}async ${methodName}(`;
            }
            return `${indent}async ${methodName}(`;
          }
        );
        if (asyncFixed !== line) {
          resultLines.push(asyncFixed);
          changed = true;
          i++;
          continue;
        }
      }
    }
    
    resultLines.push(line);
    i++;
  }
  
  if (changed) {
    const finalContent = resultLines.join('\n');
    if (!DRY_RUN) {
      writeFileSync(filePath, finalContent, 'utf8');
    }
    totalFiles++;
    const fixCount = (original.match(/return this\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\(/g) || []).length;
    console.log(`  ✓ ${filePath.split('/').slice(-2).join('/')} — tuzatildi`);
    totalFixed += fixCount;
    return true;
  }
  return false;
}

// Get all failing controller files
const output = execSync(
  `grep -rl "return this\\." apps/api/src/modules/ --include="*.controller.ts" 2>/dev/null || true`,
  { encoding: 'utf8' }
);

const files = output.trim().split('\n').filter(f => f.trim());
console.log(`\nTopilgan controller fayllar: ${files.length}`);
console.log(DRY_RUN ? '(DRY RUN rejimi)\n' : '\n');

for (const file of files) {
  if (!file.trim()) continue;
  fixControllerFile(file.trim());
}

console.log(`\n═══════════════════════════════════════════`);
console.log(`  Tuzatilgan fayllar : ${totalFiles}`);
console.log(`  Jami fix          : ${totalFixed}`);
console.log(`═══════════════════════════════════════════`);
