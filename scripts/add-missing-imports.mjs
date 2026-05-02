#!/usr/bin/env node
/**
 * Add missing 'unwrapOrInternal' import to controller files that use it but don't import it.
 * Handles multi-line import blocks correctly.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function findControllers(dir, files = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) findControllers(full, files);
      else if (e.name.endsWith('.controller.ts')) files.push(full);
    }
  } catch {}
  return files;
}

function hasImport(content) {
  // Check if unwrapOrInternal is imported
  return /import\s*\{[^}]*unwrapOrInternal[^}]*\}\s*from\s*'@common\/http-result'/.test(content);
}

function findLastImportEnd(lines) {
  // Find the index of the last line that is part of an import statement
  // Import statements end with a line containing `} from '...'` or a single-line import with `;`
  let lastEnd = -1;
  let inImport = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!inImport && (line.startsWith('import ') || line.startsWith('import{'))) {
      if (line.includes(';')) {
        // Single-line import
        lastEnd = i;
      } else {
        // Multi-line import begins
        inImport = true;
      }
    } else if (inImport) {
      if (line.includes('} from ') || line.match(/^\}\s*from\s*/)) {
        // End of multi-line import
        lastEnd = i;
        inImport = false;
      }
    } else if (!line.startsWith('import') && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && line.length > 0) {
      // Non-import, non-comment line found - stop looking if we've seen imports
      if (lastEnd >= 0) break;
    }
  }
  
  return lastEnd;
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  
  if (!content.includes('unwrapOrInternal')) return false;
  if (hasImport(content)) return false;
  
  // Check if there's an existing @common/http-result import to augment
  const httpResultMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*'@common\/http-result'/);
  if (httpResultMatch && !httpResultMatch[1].includes('unwrapOrInternal')) {
    const newContent = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*'@common\/http-result'/,
      (m, imports) => `import { ${imports.trim()}, unwrapOrInternal } from '@common/http-result'`
    );
    writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  if (httpResultMatch) return false; // Already has the import
  
  // Add new import after the last complete import statement
  const lines = content.split('\n');
  const lastEnd = findLastImportEnd(lines);
  
  if (lastEnd >= 0) {
    lines.splice(lastEnd + 1, 0, "import { unwrapOrInternal } from '@common/http-result';");
    writeFileSync(filePath, lines.join('\n'), 'utf8');
    return true;
  }
  
  return false;
}

// First, fix files that got the import inserted in the wrong place
// Detect: `import {` followed by `import { unwrapOrInternal }` on the next line
function fixBadlyInsertedImports(filePath) {
  let content = readFileSync(filePath, 'utf8');
  
  // Pattern: inside a multi-line import block, there's a misplaced import
  const badPattern = /(import\s*\{[^}]*)\nimport \{ unwrapOrInternal \} from '@common\/http-result';\n([^}]*\} from '[^']+';)/g;
  
  if (!badPattern.test(content)) return false;
  
  // Fix: remove the misplaced import and add it after the block
  content = content.replace(
    /(import\s*\{[^}]*)\nimport \{ unwrapOrInternal \} from '@common\/http-result';\n([^}]*\} from '[^']+';)/g,
    (match, before, after) => {
      return `${before}\n${after}\nimport { unwrapOrInternal } from '@common/http-result';`;
    }
  );
  
  writeFileSync(filePath, content, 'utf8');
  return true;
}

const controllers = findControllers('apps/api/src/modules');
let fixed = 0;
let reFixed = 0;

// First pass: fix badly inserted imports
for (const f of controllers) {
  if (fixBadlyInsertedImports(f)) {
    reFixed++;
  }
}

// Second pass: add missing imports  
for (const f of controllers) {
  if (fixFile(f)) {
    fixed++;
  }
}

console.log(`Re-fixed badly inserted: ${reFixed}`);
console.log(`Fixed missing imports: ${fixed}`);
