#!/usr/bin/env node
/**
 * Fix broken multi-line return unwrapOrInternal patterns
 *
 * Broken patterns (produced by previous fix script):
 *   return unwrapOrInternal(await this.svc.method();      ← premature );
 *   return unwrapOrInternal(await this.svc.method(args, {);  ← premature );
 *
 * Correct patterns:
 *   return unwrapOrInternal(await this.svc.method(
 *     args...
 *   ));
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

function countDepth(str) {
  let p = 0, b = 0;
  for (const ch of str) {
    if (ch === '(') p++;
    if (ch === ')') p--;
    if (ch === '{') b++;
    if (ch === '}') b--;
  }
  return { p, b };
}

function isBroken(line) {
  // Must start with return unwrapOrInternal(await this.
  if (!/return unwrapOrInternal\(await this\./.test(line)) return false;
  // Must end with );
  if (!/\);$/.test(line.trimEnd())) return false;
  // The line's paren depth must be positive (unclosed parens remain)
  const trimmed = line.trimEnd().slice(0, -1); // remove trailing ;
  const d = countDepth(trimmed);
  // If paren depth > 0, there are unclosed parens (multi-line case)
  return d.p > 0;
}

function fixFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let changed = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!isBroken(line)) {
      i++;
      continue;
    }

    // Remove the trailing ); (the premature unwrapOrInternal close)
    const fixedLine = line.trimEnd().slice(0, -2); // remove ');'
    lines[i] = fixedLine;

    // Count depth of fixed line
    const { p: pInit, b: bInit } = countDepth(fixedLine);

    // Find the line where paren depth drops to (pInit - 1) and brace depth to 0
    // That's where the original method call ends, and we need to add an extra )
    let p = pInit;
    let b = bInit;
    let j = i + 1;
    let foundClose = false;

    while (j < lines.length) {
      const subLine = lines[j];
      const { p: dp, b: db } = countDepth(subLine);
      const newP = p + dp;
      const newB = b + db;

      // The original closing line would bring p to pInit-1 and b to 0
      if (newP === pInit - 1 && newB <= 0) {
        // This is the line with the original `);` - add extra `)` to close unwrapOrInternal
        lines[j] = subLine.trimEnd().replace(/\);(\s*)$/, `));$1`);
        changed = true;
        foundClose = true;
        p = newP;
        b = newB;
        break;
      }

      p = newP;
      b = newB;
      j++;
    }

    if (!foundClose) {
      // Revert if we couldn't fix
      lines[i] = line;
    } else {
      changed = true;
    }

    i++;
  }

  if (changed) {
    writeFileSync(filePath, lines.join('\n'), 'utf8');
    return true;
  }
  return false;
}

const controllers = findControllers('apps/api/src/modules');
let fixed = 0;

for (const f of controllers) {
  if (fixFile(f)) {
    console.log(`Fixed: ${f.split('/').slice(-3).join('/')}`);
    fixed++;
  }
}

console.log(`\nTotal files fixed: ${fixed}`);
