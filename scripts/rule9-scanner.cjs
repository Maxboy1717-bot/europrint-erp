#!/usr/bin/env node
/**
 * Rule 9 scanner: finds async methods that
 *   - have return type Promise<Result<...>>
 *   - touch this.db.* or this.<repo>.* with await
 *   - do NOT have an enclosing try { ... } catch in the method body
 *   - do NOT use safeCall(...)
 *
 * Output: JSON list of { file, method, lineStart, lineEnd } violations.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || path.resolve(__dirname, '..');
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');

const SKIP_PATHS = [
  // Agent 5 — newly added endpoints in these dirs already have try/catch
  // We still scan but flag separately
];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      out.push(...walk(full));
    } else if (e.isFile()) {
      if (e.name.endsWith('.spec.ts') || e.name.endsWith('.test.ts')) continue;
      if (e.name.endsWith('.d.ts')) continue;
      if (!/\.(service|repository|repo)\.ts$/.test(e.name)) continue;
      out.push(full);
    }
  }
  return out;
}

// Find async methods with return type Promise<Result<...>>. Returns array of {name, openIdx}.
function findResultMethods(src) {
  const methods = [];
  // First locate every "async <ident>(" occurrence, then for each, look at the
  // signature from that point until the first "{" (body open) — and only if
  // ": Promise<Result<" appears inside that signature window, count it.
  const re = /^(\s+)async\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    // Scan forward from m.index, ignoring nested <>/() until we hit a "{" with
    // both parens and angle-brackets closed.
    let i = m.index + m[0].length - 1; // at '('
    let paren = 0, angle = 0;
    let sigEnd = -1;
    while (i < src.length) {
      const c = src[i];
      if (c === '(') paren++;
      else if (c === ')') paren--;
      else if (c === '<') angle++;
      else if (c === '>') angle--;
      else if (c === '{' && paren <= 0 && angle <= 0) { sigEnd = i; break; }
      else if (c === ';' && paren <= 0 && angle <= 0) { sigEnd = -2; break; } // abstract / interface decl
      i++;
    }
    if (sigEnd < 0) continue;
    const sig = src.slice(m.index, sigEnd);
    if (!/:\s*Promise<\s*Result\s*</.test(sig)) continue;
    methods.push({
      name: m[2],
      indent: m[1],
      sigStart: m.index,
      sigEnd,
    });
  }
  return methods;
}

// Given the position right after the regex match, find the opening "{" of the body
// and the matching close brace.
function findBodyRange(src, sigEnd) {
  // Find next "{" that opens the function body. Skip the type's nested <>.
  // Actually safer: scan forward from sigEnd, track <> depth, then first { at depth 0 of <>.
  let i = sigEnd;
  let lt = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '<') lt++;
    else if (c === '>') lt--;
    else if (c === '{' && lt <= 0) break;
    i++;
  }
  if (i >= src.length) return null;
  const openIdx = i;
  // Walk to matching close.
  let depth = 0;
  let inStr = null;
  let inLineCmt = false;
  let inBlockCmt = false;
  let inTemplate = 0; // template-literal nesting via ${}
  for (let j = openIdx; j < src.length; j++) {
    const c = src[j];
    const next = src[j + 1];
    if (inLineCmt) {
      if (c === '\n') inLineCmt = false;
      continue;
    }
    if (inBlockCmt) {
      if (c === '*' && next === '/') { inBlockCmt = false; j++; }
      continue;
    }
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === inStr) inStr = null;
      else if (inStr === '`' && c === '$' && next === '{') { inTemplate++; inStr = null; j++; }
      continue;
    }
    if (inTemplate > 0 && c === '}') {
      inTemplate--;
      inStr = '`';
      continue;
    }
    if (c === '/' && next === '/') { inLineCmt = true; j++; continue; }
    if (c === '/' && next === '*') { inBlockCmt = true; j++; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { openIdx, closeIdx: j };
    }
  }
  return null;
}

function lineFromIdx(src, idx) {
  return src.slice(0, idx).split('\n').length;
}

function methodNeedsFix(body) {
  // Has DB touch via await?
  const awaitDb = /await\s+this\.(db|drizzle)\b|await\s+db\b/.test(body)
    || /await\s+this\.[A-Za-z_][A-Za-z0-9_]*Repo(sitory)?\b/.test(body)
    || /await\s+this\.[A-Za-z_][A-Za-z0-9_]*Repo\b/.test(body);
  if (!awaitDb) return false;
  // Uses safeCall anywhere? safeCall internally try/catches every await inside.
  if (/\bsafeCall\s*\(/.test(body)) return false;
  // Has try/catch? Accept `catch (e)` AND `catch {`.
  if (/\btry\s*\{/.test(body) && /\bcatch\s*[\({]/.test(body)) return false;
  return true;
}

const candidates = walk(API_SRC);
const violations = [];
for (const file of candidates) {
  const src = fs.readFileSync(file, 'utf8');
  // Quick pre-filter: file must mention Result and at least one await this.db / await db / await this.*Repo
  if (!src.includes('Promise<Result<')) continue;
  if (!/await\s+this\.(db|drizzle)|await\s+db\b|await\s+this\.[A-Za-z_]+Repo/.test(src)) continue;

  const methods = findResultMethods(src);
  for (const meth of methods) {
    const range = findBodyRange(src, meth.sigEnd - 1);
    if (!range) continue;
    const body = src.slice(range.openIdx, range.closeIdx + 1);
    if (methodNeedsFix(body)) {
      violations.push({
        file: path.relative(ROOT, file).replace(/\\/g, '/'),
        method: meth.name,
        lineStart: lineFromIdx(src, meth.sigStart),
        lineEnd: lineFromIdx(src, range.closeIdx),
        size: body.length,
      });
    }
  }
}

console.log(JSON.stringify(violations, null, 2));
console.error(`Scanned ${candidates.length} files, found ${violations.length} violations.`);
