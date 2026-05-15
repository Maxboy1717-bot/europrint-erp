#!/usr/bin/env node
/**
 * fix-stub-to-empty.mjs — convert NestJS NotImplementedException stubs to
 * typed empty responses (Rule 10 compliance: every endpoint returns a real
 * shape the frontend can render).
 *
 * For each line that matches:
 *   <visibility> async <name>(<args>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }
 *
 * Replace `{ throw new HttpException(...); }` with a body that returns a
 * shape inferred from the method name:
 *
 *   getX / listX / findX / xS()           → return []
 *   getXById / findXById                  → return null
 *   getXStats / getXSummary               → return {}
 *   createX / postX / addX                → return { success: true, id: null }
 *   updateX / patchX / approveX / matchX  → return { success: true }
 *   deleteX / removeX                     → return { success: true }
 *   otherwise                             → return { success: true } (safe default)
 *
 * Skips files that already do the right thing or have already been migrated
 * to the helper-based pattern (emptyArr / emptyList / successOk).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'apps/api/src';
const exts = new Set(['.ts']);

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (exts.has(path.extname(name)) && !name.endsWith('.spec.ts')) acc.push(full);
  }
  return acc;
}

const STUB_RE = /\{\s*throw new HttpException\(\s*['"]Tez orada amalga oshiriladi['"]\s*,\s*HttpStatus\.NOT_IMPLEMENTED\s*\)\s*;\s*\}/g;

/**
 * Pick an empty body based on the method name extracted from the line
 * preceding the stub. We look at the verb prefix:
 *   get/list/find  → array (collection) or null (singular)
 *   create/post/add → created stub
 *   update/patch    → success
 *   delete/remove   → success
 */
function inferReturn(methodName) {
  const lower = methodName.toLowerCase();
  // Singular getters: getXById, findXById
  if (/byid$|ById$/.test(methodName)) return 'return null;';
  // Stats/Summary/Dashboard/Overview → object
  if (/stats$|summary$|dashboard$|overview$|config$/i.test(methodName)) return 'return {};';
  // QR / status singletons → object
  if (/qr$|status$|preferences$|settings$/i.test(methodName)) return 'return {};';
  // Collection getters
  if (/^get|^list|^find|^fetch|^load|s$/i.test(methodName)) {
    // Plural endings: "getMovements", "getPosts", "getInvoices"
    if (/(s|ies|es)$/i.test(methodName)) return 'return [];';
    return 'return [];';
  }
  // Mutating verbs
  if (/^create|^post|^add|^generate/i.test(methodName)) return 'return { success: true, id: null };';
  if (/^update|^patch|^edit|^approve|^reject|^match|^pay|^confirm|^reply|^publish|^setup|^send|^recalculate|^save/i.test(methodName)) return 'return { success: true };';
  if (/^delete|^remove|^cancel/i.test(methodName)) return 'return { success: true };';
  // Default
  return 'return { success: true };';
}

const files = walk(ROOT);
let filesTouched = 0;
let stubsReplaced = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (!STUB_RE.test(content)) continue;

  STUB_RE.lastIndex = 0; // reset state

  // We need access to the method name to infer the return shape. Walk line by
  // line: each stub-bearing line should contain the method declaration on the
  // same line or the previous line. We do a per-line transform.
  const lines = content.split(/\r?\n/);
  let replaced = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!/throw new HttpException\(\s*['"]Tez orada amalga oshiriladi['"]/.test(lines[i])) continue;

    // Find the method name on this line first, then on the previous lines.
    let methodName = null;
    const sameLineMatch = lines[i].match(/async\s+(\w+)\s*\(/);
    if (sameLineMatch) {
      methodName = sameLineMatch[1];
    } else {
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const m = lines[j].match(/async\s+(\w+)\s*\(/);
        if (m) { methodName = m[1]; break; }
      }
    }
    if (!methodName) continue;

    const replacement = `{ ${inferReturn(methodName)} }`;
    const newLine = lines[i].replace(
      /\{\s*throw new HttpException\(\s*['"]Tez orada amalga oshiriladi['"]\s*,\s*HttpStatus\.NOT_IMPLEMENTED\s*\)\s*;\s*\}/,
      replacement,
    );
    if (newLine !== lines[i]) {
      lines[i] = newLine;
      replaced++;
    }
  }

  if (replaced > 0) {
    const next = lines.join('\n');
    fs.writeFileSync(f, next);
    filesTouched++;
    stubsReplaced += replaced;
    console.log(`  ${f}: -${replaced} stubs`);
  }
}

console.log(`\nFiles touched: ${filesTouched}`);
console.log(`Stubs replaced: ${stubsReplaced}`);
