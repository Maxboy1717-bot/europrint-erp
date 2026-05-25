#!/usr/bin/env node
/**
 * @module audit-anemic-domain
 * @description Sprint 2 task A.18 — scan every `*.aggregate.ts` in
 * apps/api/src/modules to detect "anemic domain" smells:
 *   - public mutable fields (no `private`/`readonly`/getter)
 *   - empty aggregate body (no methods beyond constructor)
 *   - constructor with public fields (anemic anti-pattern)
 *
 * Output: aggregate-by-aggregate report. Exit 0 always — this is a
 * read-only audit. Sister script (audit-anemic-domain-fix.mjs) can
 * later apply automatic getter-isation.
 *
 * Usage: node scripts/audit-anemic-domain.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SCAN_DIR = resolve(ROOT, 'apps', 'api', 'src', 'modules');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith('.aggregate.ts')) out.push(p);
  }
  return out;
}

function analyze(file) {
  const src = readFileSync(file, 'utf-8');
  const rel = relative(ROOT, file).replace(/\\/g, '/');

  // Find the aggregate class
  const classMatch = src.match(/export\s+class\s+(\w+Aggregate|\w+)\s*\{/);
  const className = classMatch ? classMatch[1] : '(unknown)';

  // Strip comments + strings to avoid false positives
  const clean = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');

  // Public mutable fields: `public foo:` or top-level `foo:` (no prefix) inside class
  // We look for class-body lines starting with optional 'public ' followed by identifier+colon
  // and NOT preceded by 'readonly' or 'private' or 'protected' or 'get'
  const classBodyMatch = clean.match(/export\s+class\s+\w+[^{]*\{([\s\S]*)\}\s*$/);
  const body = classBodyMatch ? classBodyMatch[1] : clean;

  const fieldRe = /^\s*(?:public\s+)?([a-zA-Z_$][\w$]*)\s*:\s*[^=;{]+[=;]/gm;
  const publicMutableFields = [];
  let m;
  while ((m = fieldRe.exec(body)) !== null) {
    const line = body.slice(Math.max(0, m.index - 30), m.index + m[0].length);
    if (/\b(private|protected|readonly|static|get|set|async)\b/.test(line.split('\n').pop() || '')) continue;
    if (/^constructor\b/.test(m[1])) continue;
    publicMutableFields.push(m[1]);
  }

  // Methods other than constructor + getters/setters
  const methodCount = (body.match(/^\s*(?:async\s+|public\s+|private\s+|protected\s+)*[a-zA-Z_$][\w$]*\s*\([^)]*\)\s*[:{]/gm) || []).length;
  const constructorCount = (body.match(/\bconstructor\s*\(/g) || []).length;
  const getterCount = (body.match(/\bget\s+[a-zA-Z_$][\w$]*\s*\(/g) || []).length;
  const realMethodCount = Math.max(0, methodCount - constructorCount - getterCount);

  // Constructor exposes public MUTABLE fields, e.g. `constructor(public id: string)`.
  // `public readonly id` is the correct DDD parameter-property pattern (immutable
  // input) — we MUST NOT flag it. Only `public <name>:` without `readonly` counts.
  const ctorPublicArgs = [];
  const ctorMatch = body.match(/\bconstructor\s*\(([^)]*)\)/);
  if (ctorMatch) {
    const args = ctorMatch[1];
    for (const argMatch of args.matchAll(/\bpublic\s+(?!readonly\b|static\b|abstract\b)([a-zA-Z_$][\w$]*)\b/g)) {
      ctorPublicArgs.push(argMatch[1]);
    }
  }

  // Dedupe (the same name often appears in both field decl and ctor param).
  const dedupe = (xs) => [...new Set(xs)];
  return {
    file: rel, className,
    publicMutableFields: dedupe(publicMutableFields),
    realMethodCount, getterCount,
    ctorPublicArgs: dedupe(ctorPublicArgs),
  };
}

const files = walk(SCAN_DIR).sort();
console.log(`Scanned ${files.length} aggregate files\n`);

const violations = [];
const empties = [];
for (const f of files) {
  const a = analyze(f);
  const issues = [];
  if (a.publicMutableFields.length > 0) issues.push(`public mutable fields: ${a.publicMutableFields.join(', ')}`);
  if (a.ctorPublicArgs.length > 0) issues.push(`constructor(public ...): ${a.ctorPublicArgs.join(', ')}`);
  if (a.realMethodCount === 0 && a.getterCount === 0) {
    empties.push(a);
  }
  if (issues.length > 0) {
    violations.push({ ...a, issues });
  }
}

console.log('━━ ANEMIC DOMAIN AUDIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Aggregates scanned:                ${files.length}`);
console.log(`With public mutable fields:        ${violations.filter(v => v.publicMutableFields.length > 0).length}`);
console.log(`With constructor(public …):        ${violations.filter(v => v.ctorPublicArgs.length > 0).length}`);
console.log(`Anemic (no methods, no getters):   ${empties.length}`);
console.log('');

if (violations.length > 0) {
  console.log('── Files with anemic-domain smells ──');
  for (const v of violations) {
    console.log(`\n  ${v.file}  [${v.className}]`);
    for (const issue of v.issues) console.log(`    ⚠ ${issue}`);
    console.log(`    methods=${v.realMethodCount}, getters=${v.getterCount}`);
  }
}

if (empties.length > 0) {
  console.log('\n── Completely-anemic aggregates (no methods, no getters) ──');
  for (const e of empties.slice(0, 20)) {
    console.log(`  ${e.file}  [${e.className}]`);
  }
  if (empties.length > 20) console.log(`  … +${empties.length - 20} more`);
}

console.log('\n━━ summary ━━');
// An aggregate can be both "anemic" and have public-mutable smell — count
// each file once for the unique-issue total.
const violationFiles = new Set(violations.map(v => v.file));
const emptyFiles = new Set(empties.map(e => e.file));
const uniqueIssueFiles = new Set([...violationFiles, ...emptyFiles]);
console.log(`Aggregates with at least one issue: ${uniqueIssueFiles.size} / ${files.length}`);
process.exit(0);
