#!/usr/bin/env node
/**
 * fix-result-safe.mjs — SAFE Result<T> wrapper
 *
 * Correctly handles multi-line method signatures including complex return types
 * like Promise<Result<{ field1: Type; field2: Type }>> by tracking angle bracket
 * depth to find the ACTUAL function body opening brace.
 *
 * Only transforms methods that:
 * 1. Return Promise<Result<...>>
 * 2. Are NOT already wrapped in try/catch
 * 3. Have a concrete function body (not abstract/overloaded)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const TARGET_FILES = process.argv.slice(2);

if (TARGET_FILES.length === 0) {
  console.error('Usage: node fix-result-safe.mjs <file1.ts> [file2.ts ...]');
  process.exit(1);
}

const ERR_IMPORT = "import { Ok, Err, Result } from '@common/result';";
const TRY_MARKER = '} catch (_e) {';

/**
 * Find the matching closing brace for an opening brace at position `openPos`
 * in the given source string.
 */
function findMatchingClose(src, openPos) {
  let depth = 0;
  for (let i = openPos; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Find the actual function body opening brace for an async method.
 * We skip through:
 * - Angle brackets (generic type params) < ... >
 * - Round brackets (params) ( ... )
 * - Template literals and strings
 *
 * The function body brace is the FIRST `{` that appears AFTER the closing `):`
 * of the parameter list AND after the full return type annotation.
 */
function findBodyOpenBrace(src, methodStart) {
  let i = methodStart;
  let parenDepth = 0;
  let angleDepth = 0;
  let foundParen = false;
  let afterColon = false; // after the ): that separates params from return type

  while (i < src.length) {
    const ch = src[i];

    // Skip strings and template literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }

    // Track parens (parameter list)
    if (ch === '(') {
      parenDepth++;
      foundParen = true;
    } else if (ch === ')') {
      parenDepth--;
      if (parenDepth === 0 && foundParen) {
        // We've closed the parameter list
        // Now we need to skip the return type annotation
        // which starts with ): <type>
        afterColon = false;
        // Look for the colon
        let j = i + 1;
        while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++;
        if (src[j] === ':') {
          // Skip return type - need to find the { that is NOT inside <>, (), []
          i = j + 1;
          afterColon = true;
          let retAngle = 0;
          let retParen = 0;
          let retSquare = 0;
          while (i < src.length) {
            const rc = src[i];
            if (rc === '<') retAngle++;
            else if (rc === '>') retAngle--;
            else if (rc === '(') retParen++;
            else if (rc === ')') retParen--;
            else if (rc === '[') retSquare++;
            else if (rc === ']') retSquare--;
            else if (rc === '{' && retAngle <= 0 && retParen <= 0 && retSquare <= 0) {
              // This is the function body brace!
              return i;
            }
            i++;
          }
          return -1;
        }
      }
    }

    // Track angle brackets (generics in type)
    if (!foundParen || parenDepth > 0) {
      // ignore angles in parameter list
    } else {
      if (ch === '<') angleDepth++;
      else if (ch === '>') angleDepth--;
    }

    // If we find { while not in parens/angles, it might be the body
    if (ch === '{' && parenDepth === 0 && angleDepth <= 0 && foundParen) {
      return i;
    }

    i++;
  }
  return -1;
}

function transformFile(filePath) {
  const abs = resolve(filePath);
  const src = readFileSync(abs, 'utf8');

  // Quick skip: if already has enough try/catch wrappers, might be done
  const methodMatches = [...src.matchAll(/\basync\s+\w+\s*[<(]/g)];
  if (methodMatches.length === 0) return { path: filePath, changed: false };

  let output = src;
  let changed = false;

  // Process methods in REVERSE order to preserve positions
  const methodPositions = [];

  // Find all async method positions that return Promise<Result<
  const asyncRe = /(?:^\s+|\n\s+)async\s+(\w+)\s*[<(]/gm;
  let m;
  while ((m = asyncRe.exec(src)) !== null) {
    // Check if this method's signature contains Promise<Result<
    const snippetEnd = Math.min(m.index + 500, src.length);
    const snippet = src.slice(m.index, snippetEnd);
    if (!snippet.includes('Promise<Result<')) continue;

    methodPositions.push(m.index);
  }

  // Process in reverse order
  for (let mi = methodPositions.length - 1; mi >= 0; mi--) {
    const methodStart = methodPositions[mi];
    const bodyOpen = findBodyOpenBrace(src, methodStart);
    if (bodyOpen === -1) continue;

    // Check if immediately after { (skip whitespace) we have 'try {'
    const afterOpen = src.slice(bodyOpen + 1, bodyOpen + 30).trimStart();
    if (afterOpen.startsWith('try {') || afterOpen.startsWith('try{')) continue;

    // Also skip if the method body is empty or one-liner
    const bodyClose = findMatchingClose(output, bodyOpen);
    if (bodyClose === -1) continue;

    const bodyContent = output.slice(bodyOpen + 1, bodyClose);

    // Skip if body already has try/catch
    if (bodyContent.includes('try {') || bodyContent.includes('try{')) continue;
    // Skip if body is very short (empty or stub)
    if (bodyContent.trim().length < 5) continue;

    // Wrap body content with try/catch
    const indentMatch = src.slice(0, methodStart + 1).match(/\n([ \t]+)async/);
    const methodIndent = indentMatch ? indentMatch[1] : '  ';
    const bodyIndent = methodIndent + '  ';

    // Re-indent body content
    const trimmedBody = bodyContent;

    const newBody = `\n${bodyIndent}try {${trimmedBody}${bodyIndent}} catch (_e) {\n${bodyIndent}  return Err(String(_e));\n${bodyIndent}}\n${methodIndent}`;

    output = output.slice(0, bodyOpen + 1) + newBody + output.slice(bodyClose);
    changed = true;
  }

  if (!changed) return { path: filePath, changed: false };

  // Add Result import if missing
  if (!output.includes("from '@common/result'") && !output.includes('from "@common/result"')) {
    output = ERR_IMPORT + '\n' + output;
  }

  writeFileSync(abs, output, 'utf8');
  return { path: filePath, changed: true };
}

let total = 0, transformed = 0;
for (const f of TARGET_FILES) {
  try {
    const result = transformFile(f);
    total++;
    if (result.changed) {
      transformed++;
      console.log(`  ✓ transformed: ${f}`);
    } else {
      console.log(`  - skipped: ${f}`);
    }
  } catch (e) {
    console.error(`  ✗ ERROR: ${f}: ${e.message}`);
  }
}

console.log(`\nDone: ${transformed}/${total} files transformed`);
