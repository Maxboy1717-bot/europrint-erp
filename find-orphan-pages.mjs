#!/usr/bin/env node
/**
 * find-orphan-pages.mjs — Find page .tsx files that aren't imported anywhere.
 *
 * Strategy:
 *   1. List every .tsx file in pages/ (real pages only — exclude test/spec)
 *   2. For each page, search entire src/ tree for imports referencing it
 *      (by both @/pages/Foo absolute path AND relative ./Foo paths)
 *   3. If 0 references found → truly orphan, safe to delete
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
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      yield* walk(full);
    } else if (e.isFile() && (full.endsWith('.tsx') || full.endsWith('.ts'))) {
      yield full;
    }
  }
}

// 1. Aggregate ENTIRE src/ as one giant haystack
let haystack = '';
const fileContents = {};
for (const f of walk(SRC_DIR)) {
  const c = fs.readFileSync(f, 'utf8');
  fileContents[f] = c;
  haystack += '\n' + c;
}
console.log(`Haystack: ${(haystack.length / 1024).toFixed(1)} KB across ${Object.keys(fileContents).length} files`);

// 2. For each page file, check if it's imported
const pages = [];
for (const f of walk(PAGES_DIR)) {
  if (/\.(test|spec|smoke\.test)\.tsx?$/.test(f)) continue;
  pages.push(f);
}
console.log(`Pages to analyze: ${pages.length}`);

const orphans = [];
const referenced = [];

for (const page of pages) {
  const rel = path.relative(PAGES_DIR, page).replace(/\\/g, '/').replace(/\.(tsx|ts)$/, '');
  const basename = path.basename(page).replace(/\.(tsx|ts)$/, '');

  // Search for: @/pages/{rel} OR @/pages/{basename} OR ./{basename}
  const patterns = [
    `@/pages/${rel}`,
    `@/pages/${basename}`,
    `'./${basename}'`,
    `"./${basename}"`,
    `'../${basename}'`,
    `"../${basename}"`,
  ];

  // Special case: if the page is in a subfolder, also check parent-relative imports
  if (rel.includes('/')) {
    const subdir = rel.split('/')[0];
    patterns.push(`./${rel.split('/').slice(1).join('/')}'`);
  }

  // Strip the page's own content from haystack first (self-reference doesn't count)
  const ownContent = fileContents[page];
  const cleaned = haystack.replace(ownContent, '');

  let found = false;
  for (const p of patterns) {
    if (cleaned.includes(p)) {
      found = true;
      break;
    }
  }

  if (found) referenced.push(rel);
  else orphans.push({ path: page, rel, size: fs.statSync(page).size });
}

orphans.sort((a, b) => b.size - a.size);
console.log(`\nReferenced: ${referenced.length}`);
console.log(`Orphan:     ${orphans.length}`);
console.log(`Total orphan size: ${(orphans.reduce((s, o) => s + o.size, 0) / 1024).toFixed(1)} KB`);

fs.writeFileSync('orphan-pages.txt', orphans.map(o => path.relative(ROOT, o.path)).join('\n'));
console.log(`\nSaved to orphan-pages.txt`);
console.log('\nTop 30 orphans by size:');
for (const o of orphans.slice(0, 30)) {
  console.log(`  ${(o.size / 1024).toFixed(1).padStart(7)} KB  ${o.rel}`);
}
