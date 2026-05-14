#!/usr/bin/env node
/**
 * V2 — properly handles destructured parameters.
 *
 * Find every function body that uses t() but doesn't have its own useTranslation.
 * Inject `const { t } = useTranslation("common");` as the first statement.
 *
 * Key fix over v1: correctly skip destructured parameter lists like
 *   function X({ a, b }: Props) { ... }
 * by counting parens before looking for the body `{`.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'),
  'artifacts', 'erp-dashboard', 'src');

function walk(d, files = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist'].includes(e.name)) walk(p, files);
    } else if (/\.tsx?$/.test(e.name)) files.push(p);
  }
  return files;
}

// Find the body `{` of a function declaration.
// startIdx points to the `(` of the parameter list (or just after function name).
// Returns the index of the body `{`, or -1.
function findBodyOpenBrace(content, startIdx) {
  // 1. Skip the parameter list: find matching closing `)` for the `(` at startIdx
  let i = startIdx;
  while (i < content.length && content[i] !== '(') i++;
  if (i >= content.length) return -1;
  let depth = 1;
  i++;
  while (i < content.length && depth > 0) {
    const c = content[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      // Skip string
      const quote = c;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++;
        i++;
      }
    }
    i++;
  }
  if (depth > 0) return -1;
  // 2. Now skip optional return type annotation `: Type`
  // We need to find the first `{` that's not inside the type annotation
  // Type annotation may include generics with `<>`, unions with `|`, intersections with `&`, etc.
  // Simplest: find the next `{` but skip ones inside `<...>` (TS generics in return type)
  let angle = 0;
  while (i < content.length) {
    const c = content[i];
    if (c === '<' && /[a-zA-Z_]/.test(content[i+1] || '')) angle++;
    else if (c === '>') { if (angle > 0) angle--; }
    else if (c === '{' && angle === 0) {
      // Check it's not destructured parameter (we already passed `)`)
      return i;
    } else if (c === '=' && content[i+1] === '>') {
      // Arrow function: skip `=>` and find body
      i += 2;
      while (i < content.length && /\s/.test(content[i])) i++;
      if (content[i] === '{') return i;
      return -1; // expression body, can't inject
    }
    i++;
  }
  return -1;
}

// Walk content and find all function-body open positions
function findAllFunctionBodies(content) {
  const results = [];
  // function Name(... ) {
  // export function Name(...) {
  // export default function Name(...) {
  // const Name = (...) => {
  // const Name = (...): Type => {
  // const Name: Type = (...) => {

  const patterns = [
    /(?:^|\n)(?:export\s+(?:default\s+)?)?function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g,
    /(?:^|\n)(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*(?::\s*[^=]+)?=\s*(?:\([^=]*?\)|\w+)\s*(?::\s*[^=]+)?=>\s*\{/g,
    /(?:^|\n)(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*(?::\s*[^=]+)?=\s*\(/g,
  ];

  // For the function declarations, find the body by walking
  const fnDeclRe = /(?:^|\n)(?:export\s+(?:default\s+)?)?function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g;
  let m;
  while ((m = fnDeclRe.exec(content)) !== null) {
    // Position of the `(`
    const openParenIdx = m.index + m[0].length - 1;
    const bodyOpen = findBodyOpenBrace(content, openParenIdx);
    if (bodyOpen === -1) continue;
    // Find matching closing `}`
    const bodyEnd = findMatchingClose(content, bodyOpen);
    if (bodyEnd === -1) continue;
    results.push({ name: m[1], bodyStart: bodyOpen + 1, bodyEnd });
  }

  // Arrow function declarations
  const arrowDeclRe = /(?:^|\n)(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*(?::\s*[A-Za-z][^=\n]*)?=\s*\(/g;
  while ((m = arrowDeclRe.exec(content)) !== null) {
    const openParenIdx = m.index + m[0].length - 1;
    const bodyOpen = findBodyOpenBrace(content, openParenIdx);
    if (bodyOpen === -1) continue;
    const bodyEnd = findMatchingClose(content, bodyOpen);
    if (bodyEnd === -1) continue;
    results.push({ name: m[1], bodyStart: bodyOpen + 1, bodyEnd });
  }

  return results;
}

function findMatchingClose(content, openIdx) {
  let depth = 1;
  let i = openIdx + 1;
  while (i < content.length && depth > 0) {
    const c = content[i];
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++;
        i++;
      }
    } else if (c === '/' && content[i+1] === '/') {
      while (i < content.length && content[i] !== '\n') i++;
    } else if (c === '/' && content[i+1] === '*') {
      i += 2;
      while (i < content.length - 1 && !(content[i] === '*' && content[i+1] === '/')) i++;
      i++;
    } else if (c === '{') depth++;
    else if (c === '}') depth--;
    i++;
  }
  return depth === 0 ? i - 1 : -1;
}

let fixedFiles = 0;
let totalInjections = 0;

for (const f of walk(SRC)) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  if (!/\bt\(/.test(content)) continue;

  const fns = findAllFunctionBodies(content);
  // Sort by bodyStart desc so we can insert without shifting offsets
  fns.sort((a, b) => b.bodyStart - a.bodyStart);

  for (const fn of fns) {
    const body = content.slice(fn.bodyStart, fn.bodyEnd);
    // Skip if function body doesn't use t()
    if (!/\bt\(/.test(body)) continue;
    // Skip if function body already has its own hook call
    if (/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation/.test(body)) continue;
    if (/\buseTranslation\s*\(/.test(body)) continue;
    // Inject hook at the start of body
    const hookLine = `\n  const { t } = useTranslation("common");`;
    content = content.slice(0, fn.bodyStart) + hookLine + content.slice(fn.bodyStart);
    totalInjections++;
  }

  if (content === original) continue;

  // Ensure import is present
  if (!/import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]@\/lib\/i18n['"]/.test(content)) {
    const lines = content.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, `import { useTranslation } from '@/lib/i18n';`);
    } else {
      lines.unshift(`import { useTranslation } from '@/lib/i18n';`);
    }
    content = lines.join('\n');
  }

  fs.writeFileSync(f, content, 'utf8');
  fixedFiles++;
}

console.log(`Files fixed: ${fixedFiles}`);
console.log(`Total hook injections: ${totalInjections}`);
