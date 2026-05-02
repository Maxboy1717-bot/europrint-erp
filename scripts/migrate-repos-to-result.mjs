#!/usr/bin/env node
/**
 * Migrate legacy repositories from old Promise<T> pattern to Promise<Result<T>> with safeCall.
 *
 * Uses a correct two-pass algorithm to handle complex return types including
 * inline object literals like Promise<{ foo: string; bar: number }>.
 */

import fs from 'fs';
import path from 'path';

const TARGET_FILES = [
  'apps/api/src/modules/ai/application/ai-router.repository.ts',
  'apps/api/src/modules/ai/services/ai-automation.repository.ts',
  'apps/api/src/modules/ai/services/hr-ai.repository.ts',
  'apps/api/src/modules/chat/repositories/chat-message-base.repository.ts',
  'apps/api/src/modules/chat/repositories/chat-message.repository.ts',
  'apps/api/src/modules/chat/repositories/chat-room.repository.ts',
  'apps/api/src/modules/core/application/seven-functions.repository.ts',
  'apps/api/src/modules/crm/application/crm-activities.repository.ts',
  'apps/api/src/modules/crm/application/crm-ai.repository.ts',
  'apps/api/src/modules/crm/application/crm-auto-lead.repository.ts',
  'apps/api/src/modules/crm/application/crm-bitrix-compat.repository.ts',
  'apps/api/src/modules/crm/application/crm-companies.repository.ts',
  'apps/api/src/modules/crm/application/crm-contacts.repository.ts',
  'apps/api/src/modules/crm/application/crm-custom-fields.repository.ts',
  'apps/api/src/modules/crm/application/crm-extras.repository.ts',
  'apps/api/src/modules/crm/application/crm-leads-ops.repository.ts',
  'apps/api/src/modules/director/application/coordination.repository.ts',
  'apps/api/src/modules/director/application/dashboard-query.repository.ts',
  'apps/api/src/modules/director/application/okr.repository.ts',
  'apps/api/src/modules/director/application/strategic.repository.ts',
  'apps/api/src/modules/ecommerce/ecommerce.repository.ts',
  'apps/api/src/modules/finance/application/finance-ap.repository.ts',
  'apps/api/src/modules/finance/application/finance-ar.repository.ts',
  'apps/api/src/modules/finance/application/finance-payroll.repository.ts',
  'apps/api/src/modules/finance/application/fp-cycle-cron.repository.ts',
  'apps/api/src/modules/hr/ai-interview-v2/ai-interview-v2.repository.ts',
  'apps/api/src/modules/hr/application/hr-compat-a.repository.ts',
  'apps/api/src/modules/hr/application/hr-compat-safety.repository.ts',
  'apps/api/src/modules/hr/application/hr-dashboard-extra.repository.ts',
  'apps/api/src/modules/hr/application/hr-dashboard.repository.ts',
  'apps/api/src/modules/hr/career-path/career-path.repository.ts',
  'apps/api/src/modules/hr/common/hr-v2-seed.repository.ts',
  'apps/api/src/modules/hr/daily-report/daily-report.repository.ts',
  'apps/api/src/modules/hr/discipline-v2/discipline-v2-absence.repository.ts',
  'apps/api/src/modules/hr/discipline-v2/discipline-v2.repository.ts',
  'apps/api/src/modules/hr/document-workflow/document-workflow.repository.ts',
  'apps/api/src/modules/hr/enps/enps.repository.ts',
  'apps/api/src/modules/hr/gamification/gamification.repository.ts',
  'apps/api/src/modules/hr/pip/pip.repository.ts',
  'apps/api/src/modules/hr/reception/reception.repository.ts',
  'apps/api/src/modules/hr/recruitment/recruitment-stats.repository.ts',
  'apps/api/src/modules/hr/telegram-bots/report-bot-data.repository.ts',
  'apps/api/src/modules/hr/telegram-bots/telegram-bots.repository.ts',
  'apps/api/src/modules/org-structure/org-structure.repository.ts',
  'apps/api/src/modules/org-structure/position-folder.repository.ts',
  'apps/api/src/modules/pos/employee-write-off.repository.ts',
  'apps/api/src/modules/pos/pos-barcode-ext.repository.ts',
  'apps/api/src/modules/pos/pos-inventory-count.repository.ts',
  'apps/api/src/modules/pos/pos-lifecycle-block.repository.ts',
  'apps/api/src/modules/pos/pos-request-ext.repository.ts',
  'apps/api/src/modules/pos/pos-stock-reservation.repository.ts',
  'apps/api/src/modules/pos/pos-telegram-ext.repository.ts',
  'apps/api/src/modules/pos/pos-telegram.repository.ts',
  'apps/api/src/modules/pos/repositories/pos-inventory.repository.ts',
  'apps/api/src/modules/pos/repositories/pos-mini-app.repository.ts',
  'apps/api/src/modules/remaining/company-state.repository.ts',
  'apps/api/src/modules/remaining/fi.repository.ts',
  'apps/api/src/modules/remaining/reports-hub.repository.ts',
  'apps/api/src/modules/remaining/system.repository.ts',
  'apps/api/src/modules/remaining/waste.repository.ts',
  'apps/api/src/modules/sap/sap.repository.ts',
  'apps/api/src/modules/sd/application/sd-quotations.repository.ts',
  'apps/api/src/modules/website/website.repository.ts',
];

// ─────────────────────────────────────────────
// Low-level character scanning utilities
// ─────────────────────────────────────────────

/** Skip over a string/template-literal starting at position i (the opening quote). */
function skipString(src, i) {
  const q = src[i]; i++;
  if (q === '`') {
    while (i < src.length) {
      if (src[i] === '\\') { i += 2; continue; }
      if (src[i] === '`') return i + 1;
      if (src[i] === '$' && src[i+1] === '{') {
        i += 2; let d = 1;
        while (i < src.length && d > 0) {
          if (src[i] === '{') d++;
          else if (src[i] === '}') d--;
          else if (src[i] === '\\') i++;
          else if (src[i] === '"' || src[i] === "'" || src[i] === '`') { i = skipString(src, i) - 1; }
          i++;
        }
        continue;
      }
      i++;
    }
    return i;
  }
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === q) return i + 1;
    i++;
  }
  return i;
}

/** Skip a line comment or block comment. Returns position after comment. */
function skipComment(src, i) {
  if (src[i] === '/' && src[i+1] === '/') {
    while (i < src.length && src[i] !== '\n') i++;
    return i;
  }
  if (src[i] === '/' && src[i+1] === '*') {
    i += 2;
    while (i < src.length - 1 && !(src[i] === '*' && src[i+1] === '/')) i++;
    return i + 2;
  }
  return i;
}

/** Advance past strings and comments, returning the next "real" position. */
function advance(src, i) {
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') return [i, skipString(src, i)];
    if (c === '/' && (src[i+1] === '/' || src[i+1] === '*')) return [i, skipComment(src, i)];
    return [i, i]; // no skip needed
  }
  return [i, i];
}

/** Find the matching closing brace for an opening `{` at openPos. */
function findMatchingClose(src, openPos, open = '{', close = '}') {
  let depth = 0, i = openPos;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(src, i); continue; }
    if (c === '/' && (src[i+1] === '/' || src[i+1] === '*')) { i = skipComment(src, i); continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

/** Find the matching `)` for a `(` at openPos. */
function findMatchingParen(src, openPos) {
  return findMatchingClose(src, openPos, '(', ')');
}

// ─────────────────────────────────────────────
// Find method body `{`
// ─────────────────────────────────────────────

/**
 * Starting from `startPos` (right after the closing `)` of the param list),
 * advance scanning past the return type annotation to find the method body `{`.
 *
 * Algorithm (two-pass):
 *   1. Find the first `{` at (angleBracket=0, brace=0) from `startPos`.
 *   2. Find its matching `}`.
 *   3. Skip whitespace after `}`.
 *   4. If the next char is NOT `{`, this `{` is the method body → return it.
 *   5. If the next char IS `{` at depth 0, the first `{` was an object type literal
 *      in the return annotation → repeat from step 1 starting at step 4's `{`.
 *
 * This correctly handles:
 *   ): string {                     → simple, finds {
 *   ): Promise<T> {                 → angle brackets closed before {
 *   ): { foo: string } {            → obj type first, then method body
 *   ): Promise<{ foo: string }> {   → obj type inside angle brackets
 *   ): { a: { b: string }; } {     → nested obj type, then method body
 */
function findMethodBodyBrace(src, startPos) {
  let i = startPos;

  // We'll iterate finding `{` at depth 0 until we confirm it's the method body.
  while (i < src.length) {
    // Scan forward to next `{` at angleBracket=0 AND brace=0
    let angleBracketDepth = 0;
    let candidate = -1;

    let j = i;
    scanLoop:
    while (j < src.length) {
      const c = src[j];
      if (c === '"' || c === "'" || c === '`') { j = skipString(src, j); continue; }
      if (c === '/' && (src[j+1] === '/' || src[j+1] === '*')) { j = skipComment(src, j); continue; }
      if (c === '<') angleBracketDepth++;
      else if (c === '>') { if (angleBracketDepth > 0) angleBracketDepth--; }
      else if (c === '{' && angleBracketDepth === 0) {
        candidate = j;
        break scanLoop;
      } else if (c === ';' && angleBracketDepth === 0) {
        // Semicolon at top level → end of declaration, no method body
        return -1;
      }
      j++;
    }

    if (candidate === -1) return -1;

    // Find the matching `}` for this candidate
    const matchingClose = findMatchingClose(src, candidate);
    if (matchingClose === -1) return -1;

    // Skip whitespace after the matching `}`
    let k = matchingClose + 1;
    while (k < src.length && /\s/.test(src[k])) k++;

    if (k >= src.length) return candidate; // end of file → this was method body
    if (src[k] !== '{') return candidate;  // next significant char is not `{` → method body

    // The candidate was an object type literal; continue from the next `{`
    i = k;
  }

  return -1;
}

// ─────────────────────────────────────────────
// Upgrade return type in signature
// ─────────────────────────────────────────────

/**
 * Given the text slice between `)` and `{` (i.e., the optional return type annotation),
 * wrap the Promise<T> in Promise<Result<T>>.
 *
 * Handles:
 *   `: Promise<T>`     → `: Promise<Result<T>>`
 *   `: T` (non-Promise)→ `: Promise<Result<T>>`
 *   (empty/whitespace) → `: Promise<Result<unknown>>`  [for untyped methods]
 */
function upgradeReturnType(sigSlice) {
  const trimmed = sigSlice.trim();

  // No return type annotation (just whitespace before {)
  if (!trimmed || trimmed === '') {
    return sigSlice + ': Promise<Result<unknown>>';
  }

  // Already has Result<
  if (trimmed.includes('Result<')) return sigSlice;

  // `: Promise<T>` form
  const colonPromise = /^(\s*:\s*Promise<)([\s\S]+?)(>\s*)$/.exec(sigSlice);
  if (colonPromise) {
    const [, pre, inner, suf] = colonPromise;
    return `${pre}Result<${inner}>${suf}`;
  }

  // `: Promise<T>` where inner type contains nested `>` — greedy version
  // Try matching with greedy inner
  const colonPromiseGreedy = /^(\s*:\s*Promise<)([\s\S]+)(>\s*)$/.exec(sigSlice);
  if (colonPromiseGreedy) {
    const [, pre, inner, suf] = colonPromiseGreedy;
    if (!inner.trimStart().startsWith('Result<')) {
      return `${pre}Result<${inner}>${suf}`;
    }
    return sigSlice;
  }

  // `: SomeOtherType` — non-Promise return type (rare but possible)
  const colonType = /^(\s*:\s*)([\s\S]+?)(\s*)$/.exec(sigSlice);
  if (colonType) {
    const [, colon, type, trail] = colonType;
    const t = type.trim();
    if (!t || t === 'void' || t === 'never') return sigSlice;
    if (t.startsWith('Promise<')) return sigSlice; // handled above, skip
    if (t.startsWith('Result<')) return sigSlice;
    return `${colon}Promise<Result<${t}>${trail}`;
  }

  return sigSlice;
}

// ─────────────────────────────────────────────
// Main file migration
// ─────────────────────────────────────────────

function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP (not found): ${path.basename(filePath)}`);
    return false;
  }

  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // Regex: matches async class methods (indented, named, opening paren)
  // NOT arrow functions (those have `=` before `async`)
  const METHOD_RE = /^([ \t]+)async\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(\()/gm;

  const methodsToTransform = [];
  let m;

  while ((m = METHOD_RE.exec(src)) !== null) {
    const indent = m[1];
    const methodNameStart = m.index;
    const openParenPos = m.index + m[0].length - 1;

    // Skip if there's something like `= async` (arrow function assignment)
    const lineStart = src.lastIndexOf('\n', methodNameStart) + 1;
    const prefixOnLine = src.slice(lineStart, methodNameStart).trimEnd();
    if (prefixOnLine.endsWith('=')) continue;

    // Find closing paren of parameter list
    const closeParenPos = findMatchingParen(src, openParenPos);
    if (closeParenPos === -1) continue;

    // The sigSlice is from after `)` to the method body `{`
    const bodyBracePos = findMethodBodyBrace(src, closeParenPos + 1);
    if (bodyBracePos === -1) continue;

    const sigSlice = src.slice(closeParenPos + 1, bodyBracePos);

    // Skip void/never methods
    if (/Promise<void>|Promise<never>|:\s*void\b|:\s*never\b/.test(sigSlice)) continue;

    // Skip already migrated
    if (/Promise<Result</.test(sigSlice)) continue;

    // Find end of method body
    const bodyEnd = findMatchingClose(src, bodyBracePos);
    if (bodyEnd === -1) continue;

    // Skip if body already contains safeCall (avoid double-wrapping)
    const bodyContent = src.slice(bodyBracePos + 1, bodyEnd);
    if (bodyContent.includes('safeCall(')) continue;

    methodsToTransform.push({
      closeParenPos,
      sigSlice,
      bodyBracePos,
      bodyEnd,
      bodyContent,
      indent,
    });
  }

  if (methodsToTransform.length === 0) {
    console.log(`  SKIP (no eligible methods): ${path.basename(filePath)}`);
    return false;
  }

  // Process from END to START (to keep earlier positions valid)
  methodsToTransform.sort((a, b) => b.bodyBracePos - a.bodyBracePos);

  for (const method of methodsToTransform) {
    const { closeParenPos, sigSlice, bodyBracePos, bodyEnd, bodyContent, indent } = method;

    const innerIndent = indent + '  ';

    // Indent each line of the body by 2 extra spaces
    const indentedBody = bodyContent
      .split('\n')
      .map(line => (line.trim() === '' ? line : '  ' + line))
      .join('\n');

    const newBody = `{\n${innerIndent}return safeCall(async () => {${indentedBody}${innerIndent}}, 'DB_ERROR');\n${indent}}`;

    // 1. Replace method body (from bodyBracePos to bodyEnd inclusive)
    src = src.slice(0, bodyBracePos) + newBody + src.slice(bodyEnd + 1);

    // 2. Upgrade the return type in the signature slice
    // sigSlice is from closeParenPos+1 to bodyBracePos (original positions)
    // After body replacement, the content from bodyBracePos onwards changed,
    // but closeParenPos+1 to bodyBracePos is still the original sigSlice.
    const upgradedSig = upgradeReturnType(sigSlice);
    if (upgradedSig !== sigSlice) {
      src = src.slice(0, closeParenPos + 1) + upgradedSig + src.slice(closeParenPos + 1 + sigSlice.length);
    }
  }

  // Add/update @common/result import
  if (/from\s+['"]@common\/result['"]/.test(src)) {
    src = src.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@common\/result['"]/,
      (match, imports) => {
        const items = imports.split(',').map(s => s.trim()).filter(Boolean);
        const needed = ['safeCall', 'Result'];
        const toAdd = needed.filter(n => !items.includes(n));
        if (toAdd.length === 0) return match;
        return `import { ${[...items, ...toAdd].join(', ')} } from '@common/result'`;
      }
    );
  } else {
    const lines = src.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    const newImport = "import { safeCall, Result } from '@common/result';";
    if (lastImport >= 0) lines.splice(lastImport + 1, 0, newImport);
    else lines.unshift(newImport);
    src = lines.join('\n');
  }

  if (src === original) {
    console.log(`  NO CHANGE: ${path.basename(filePath)}`);
    return false;
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`  MIGRATED (${methodsToTransform.length} methods): ${path.basename(filePath)}`);
  return true;
}

// ─────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║  Repository → Result<T> Migration (v3)           ║');
console.log('╚══════════════════════════════════════════════════╝\n');

let migrated = 0;
for (const file of TARGET_FILES) {
  const changed = migrateFile(file);
  if (changed) migrated++;
}

console.log(`\n✓ Done: ${migrated} / ${TARGET_FILES.length} files changed`);
