#!/usr/bin/env node
/**
 * check-page-has-crud.mjs
 * Yangi qo'shilgan sahifa fayllarida CRUD (mutation) borligini tekshiradi.
 * WARNING only — commit block qilmaydi.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let diff;
try {
  diff = execSync('git diff --cached --name-only --diff-filter=A -- "artifacts/erp-dashboard/src/pages/*.tsx"', { encoding: 'utf8' });
} catch {
  process.exit(0);
}

const newPages = diff.split('\n').filter(f => f.endsWith('.tsx') && f.includes('/pages/'));

for (const pageFile of newPages) {
  try {
    const content = readFileSync(pageFile, 'utf8');
    const hasQuery = /useQuery\s*\(/.test(content);
    const hasMutation = /useMutation\s*\(/.test(content);
    const isComingSoon = /EPComingSoon/.test(content);

    if (hasQuery && !hasMutation && !isComingSoon) {
      console.warn(`\n⚠️  Yangi sahifa faqat READ (GET):`);
      console.warn(`   ${pageFile}`);
      console.warn(`   💡 Kamida bitta useMutation() qo'shishni ko'rib chiqing (CREATE/UPDATE/DELETE)\n`);
    }
  } catch {}
}

process.exit(0); // WARNING only
