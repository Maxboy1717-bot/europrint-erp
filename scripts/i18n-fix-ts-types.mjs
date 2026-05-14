#!/usr/bin/env node
/**
 * Fix codemod mistake: it converted TypeScript built-in types like
 * Promise<T>, Map<K,V>, Array<T>, Set<T>, Record<K,V> etc. into
 * {t("promise")}<T> ... etc.
 *
 * Strategy: find `{t("foo")}<` patterns where `foo` is a known TS type
 * (lowercased), and restore the original PascalCase identifier.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'),
  'artifacts', 'erp-dashboard', 'src');

const TYPE_MAP = {
  promise: 'Promise',
  array: 'Array',
  map: 'Map',
  set: 'Set',
  record: 'Record',
  partial: 'Partial',
  pick: 'Pick',
  omit: 'Omit',
  readonly: 'Readonly',
  required: 'Required',
  exclude: 'Exclude',
  extract: 'Extract',
  nonNullable: 'NonNullable',
  parameters: 'Parameters',
  returnType: 'ReturnType',
  awaited: 'Awaited',
  weakMap: 'WeakMap',
  weakSet: 'WeakSet',
  ref: 'Ref',
  mutableRef: 'MutableRefObject',
  ref1: 'Ref',
  reactNode: 'ReactNode',
  jsxElement: 'JSX.Element',
  // Promise method patterns: looks like {t("promise")}.all
  promise1: 'Promise',
  promise2: 'Promise',
};

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist'].includes(e.name)) continue;
      walk(p, files);
    } else if (/\.tsx?$/.test(e.name)) {
      files.push(p);
    }
  }
  return files;
}

const files = walk(SRC);

let totalFiles = 0;
let totalFixes = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const original = content;
  let fixesInFile = 0;

  // Pattern: {t("word")}< or {t("word")}.method or {t("word")}.all or similar code positions
  // We replace any {t("KEY")} immediately followed by < (TS generic), . (method call), or ( (constructor)
  // back to the corresponding capitalized type identifier
  for (const [key, replacement] of Object.entries(TYPE_MAP)) {
    const patterns = [
      new RegExp(`\\{t\\("${key}"\\)\\}<`, 'g'),       // Generic: {t("promise")}<void>
      new RegExp(`\\{t\\("${key}"\\)\\}\\.`, 'g'),     // Method: {t("promise")}.all
      new RegExp(`\\{t\\("${key}"\\)\\}\\(`, 'g'),     // Call: {t("promise")}(...)
      new RegExp(`new \\{t\\("${key}"\\)\\}`, 'g'),    // new {t("promise")}
      new RegExp(`: \\{t\\("${key}"\\)\\}`, 'g'),      // Type annotation: : {t("promise")}
    ];
    const repls = [
      `${replacement}<`,
      `${replacement}.`,
      `${replacement}(`,
      `new ${replacement}`,
      `: ${replacement}`,
    ];
    for (let i = 0; i < patterns.length; i++) {
      const before = content;
      content = content.replace(patterns[i], repls[i]);
      if (content !== before) {
        // Count matches
        const matches = before.match(patterns[i]);
        if (matches) fixesInFile += matches.length;
      }
    }
  }

  // Also catch generic `{t("XXX")}<TypeName>` where XXX could be ANY camelCase identifier
  // that got picked up. Be careful — only fix if it clearly looks like a TS type position
  // (function declaration, type alias, interface).
  // Specifically: lines that have `:` followed by `{t(...)}<` are likely return type annotations
  const genericFix = /(:\s*\([^)]*\)\s*=>\s*)\{t\("([a-zA-Z0-9_]+)"\)\}</g;
  content = content.replace(genericFix, (match, prefix, key) => {
    // Capitalize first letter
    const restored = key.charAt(0).toUpperCase() + key.slice(1);
    fixesInFile++;
    return `${prefix}${restored}<`;
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    totalFiles++;
    totalFixes += fixesInFile;
    console.log(`  ${fixesInFile} :: ${path.relative(SRC, f)}`);
  }
}

console.log(`\nFiles fixed: ${totalFiles}`);
console.log(`Total fixes: ${totalFixes}`);
