#!/usr/bin/env node
/**
 * Anti-Revert Guard
 * ------------------
 * Sabab: 2026-05-27 da kommit `2c20cbf4` `fix(tests): update 20 failing test
 * suites to match Result pattern and new deps` deb belgilandi, lekin aslida
 * 4 soat oldingi `feat(hr-add-employee-tx)` (kommit `8b763a0b`) ni qaytardi.
 * TxOutcome discriminated union pattern → throw new Error() ga regressiya.
 *
 * Qoida: `fix(tests)` kommiti yaqindagi (so'nggi 7 kun) feat()/refactor()
 * larni qaytarmasligi kerak. Test fail bo'lsa — TEST yangilanadi, kod emas.
 *
 * Bypass: `git commit --no-verify` (faqat PR review bilan).
 *
 * Ishlaydigan joyi: commit-msg Husky hook'i (commit xabarini argv[2] orqali oladi).
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const msgFile = process.argv[2];
if (!msgFile || !existsSync(msgFile)) {
  // Husky bu skriptni boshqacha chaqirsa — sukut bilan o'tib ketamiz
  process.exit(0);
}

const commitMsg = readFileSync(msgFile, 'utf8').trim();
const isFixTests = /^fix\(tests?\)(!)?:/i.test(commitMsg);

if (!isFixTests) process.exit(0); // faqat fix(tests) kommitida ishlaymiz

// Staged fayllarni olamiz
let stagedRaw = '';
try {
  stagedRaw = execSync('git diff --cached --name-only', { encoding: 'utf8' });
} catch {
  process.exit(0); // git mavjud emas yoki repo emas
}
const stagedFiles = stagedRaw.trim().split('\n').filter(Boolean);

// Test fayllarini chiqarib tashlaymiz — ular tabiiy ravishda fix(tests) da o'zgaradi
const productionFiles = stagedFiles.filter(
  (f) => !/\.(test|spec)\.(ts|tsx|js|mjs)$/.test(f) && !f.includes('__tests__'),
);

if (productionFiles.length === 0) process.exit(0);

const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const violations = [];

for (const file of productionFiles) {
  let log = '';
  try {
    log = execSync(
      `git log --since="${sinceDate}" --pretty=format:"%h %s" -- "${file}"`,
      { encoding: 'utf8' },
    ).trim();
  } catch {
    continue;
  }
  if (!log) continue;

  const lines = log.split('\n').filter(Boolean);
  const featOrRefactor = lines.filter((l) =>
    /\s(feat|refactor)(\([a-z0-9_-]+\))?!?:/i.test(l),
  );
  if (featOrRefactor.length > 0) {
    violations.push({ file, commits: featOrRefactor });
  }
}

if (violations.length === 0) process.exit(0);

console.error('');
console.error('❌ ANTI-REVERT GUARD: fix(tests) kommit yaqindagi feat/refactor ni qaytaryapdi.');
console.error('');
console.error('Quyidagi fayllar so\'nggi 7 kun ichida feat()/refactor() da o\'zgargan:');
console.error('');
for (const v of violations) {
  console.error(`  📄 ${v.file}`);
  for (const c of v.commits) {
    console.error(`     ${c}`);
  }
  console.error('');
}
console.error('💡 To\'g\'risi: kodni qaytarish o\'rniga TEST\'larni yangilang.');
console.error('   Tarix: kommit 2c20cbf4 aynan shu xatoni qildi — TxOutcome');
console.error('   pattern\'ni o\'chirib, "throw new Error" ga qaytardi.');
console.error('');
console.error('   Agar majbur bo\'lsa: PR oching, owner review so\'rang,');
console.error('   yoki `git commit --no-verify` (bypass — tarixda qoladi).');
console.error('');
process.exit(1);
