#!/usr/bin/env node
/**
 * find-orphan-tests.mjs — find *.test.tsx / *.smoke.test.tsx files whose
 * subject component no longer exists.
 *
 * Convention: `Foo.smoke.test.tsx` tests `Foo.tsx`. If `Foo.tsx` is gone,
 * the smoke test is dead weight.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/pages');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile()) yield full;
  }
}

const orphans = [];
for (const f of walk(PAGES_DIR)) {
  const base = path.basename(f);
  const m = base.match(/^(.+?)\.(smoke\.test|test|spec)\.tsx?$/);
  if (!m) continue;
  const subject = m[1];
  const testDir = path.dirname(f);
  // Test could live in the same dir as subject, or in a sibling __tests__/ dir.
  // Look in: testDir AND parent of testDir (if it's __tests__).
  const candidates = [
    path.join(testDir, `${subject}.tsx`),
    path.join(testDir, `${subject}.ts`),
  ];
  if (path.basename(testDir) === '__tests__') {
    const parent = path.dirname(testDir);
    candidates.push(path.join(parent, `${subject}.tsx`));
    candidates.push(path.join(parent, `${subject}.ts`));
  }
  if (!candidates.some(c => fs.existsSync(c))) {
    orphans.push({ test: f, size: fs.statSync(f).size });
  }
}

console.log(`Orphan test files: ${orphans.length}`);
console.log(`Total size: ${(orphans.reduce((s, o) => s + o.size, 0) / 1024).toFixed(1)} KB`);

fs.writeFileSync('orphan-tests.txt', orphans.map(o => path.relative(ROOT, o.test)).join('\n'));
console.log(`\nSaved to orphan-tests.txt`);
console.log('\nTop 20:');
for (const o of orphans.slice(0, 20)) {
  console.log(`  ${path.relative(PAGES_DIR, o.test)}`);
}
