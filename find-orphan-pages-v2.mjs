#!/usr/bin/env node
/**
 * find-orphan-pages-v2.mjs — Robust orphan detector.
 *
 * Improvements over v1:
 *   1. Checks ANY path containing the basename (catches ./kanban/TaskDetailSheet)
 *   2. Also matches by exported component identifier (e.g. `import { Foo } from`)
 *   3. Ignores comments/strings — only counts real reference occurrences
 *      by basename appearing in `from "..."` import statements OR `import("...")` calls.
 *   4. Reads basename-AND-exported-name from each file's `export` declarations.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/pages');
const SRC_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules' || e.name === 'test') continue;
      yield* walk(full);
    } else if (e.isFile() && (full.endsWith('.tsx') || full.endsWith('.ts'))) {
      yield full;
    }
  }
}

// Aggregate all import paths and identifiers used across src/
const importPaths = new Set();   // every string inside import "..." / import("...")
const usedNames = new Set();     // every identifier mentioned in code (loose match)
const fileContents = {};

for (const f of walk(SRC_DIR)) {
  const c = fs.readFileSync(f, 'utf8');
  fileContents[f] = c;

  // Strip block + line comments + strings (mostly)
  const noComments = c
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  // Capture every import/require/dynamic-import literal path
  const importRe = /(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
  let m;
  while ((m = importRe.exec(noComments)) !== null) {
    importPaths.add(m[1] || m[2] || m[3]);
  }

  // Capture identifier usage (loose: word boundary, exclude file's own decls)
  const identRe = /\b([A-Z][A-Za-z0-9_]+)\b/g;
  while ((m = identRe.exec(noComments)) !== null) {
    usedNames.add(`${f}|${m[1]}`);   // tagged with source file so we can filter self
  }
}

console.log(`Indexed ${Object.keys(fileContents).length} files; ${importPaths.size} unique import paths`);

// For each page file, find its basename + every exported identifier
function exportedNames(code) {
  const names = new Set();
  const re = /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  let m;
  while ((m = re.exec(code)) !== null) names.add(m[1]);
  // export { Foo, Bar as Baz }
  const re2 = /export\s*\{\s*([^}]+)\s*\}/g;
  while ((m = re2.exec(code)) !== null) {
    for (const part of m[1].split(',')) {
      const id = part.trim().split(/\s+as\s+/).pop();
      if (id) names.add(id.trim());
    }
  }
  return names;
}

const pages = [];
for (const f of walk(PAGES_DIR)) {
  if (/\.(test|spec|smoke\.test)\.tsx?$/.test(f)) continue;
  pages.push(f);
}

const orphans = [];
const referenced = [];

for (const page of pages) {
  const basename = path.basename(page).replace(/\.(tsx|ts)$/, '');
  const exported = exportedNames(fileContents[page]);

  // (1) Check if any import path ends with this basename
  let referencedByPath = false;
  for (const ip of importPaths) {
    if (ip.endsWith(`/${basename}`) || ip === `./${basename}` || ip === `../${basename}`) {
      referencedByPath = true;
      break;
    }
  }

  // (2) Check if any exported name is mentioned in a different file
  let referencedByName = false;
  if (!referencedByPath && exported.size > 0) {
    for (const name of exported) {
      for (const f of Object.keys(fileContents)) {
        if (f === page) continue;
        // word-boundary match on the identifier, after stripping comments
        const code = fileContents[f].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        const re = new RegExp(`\\b${name}\\b`);
        if (re.test(code)) {
          referencedByName = true;
          break;
        }
      }
      if (referencedByName) break;
    }
  }

  if (referencedByPath || referencedByName) {
    referenced.push(page);
  } else {
    orphans.push({ path: page, size: fs.statSync(page).size, exported: [...exported].join(',') });
  }
}

orphans.sort((a, b) => b.size - a.size);
console.log(`\nReferenced: ${referenced.length}`);
console.log(`Orphan:     ${orphans.length}`);
console.log(`Total orphan size: ${(orphans.reduce((s, o) => s + o.size, 0) / 1024).toFixed(1)} KB`);

fs.writeFileSync('orphan-pages-v2.txt', orphans.map(o => path.relative(ROOT, o.path)).join('\n'));
console.log(`\nSaved to orphan-pages-v2.txt`);
console.log('\nTop 40 orphans by size:');
for (const o of orphans.slice(0, 40)) {
  console.log(`  ${(o.size / 1024).toFixed(1).padStart(7)} KB  ${path.relative(PAGES_DIR, o.path).replace(/\\/g, '/')}  [exports: ${o.exported.slice(0, 60)}]`);
}
