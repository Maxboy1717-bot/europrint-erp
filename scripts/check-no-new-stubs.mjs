#!/usr/bin/env node
/**
 * check-no-new-stubs.mjs
 * Yangi notImplemented() chaqiruvlari qo'shilganini tekshiradi.
 * Commit block qiladi agar yangi stub topilsa.
 */
import { execSync } from 'node:child_process';

const STUB_PATTERN = /notImplemented\s*\(/;
const IGNORE_EXTENSIONS = ['.spec.ts', '.test.ts', '.spec.tsx', '.test.tsx'];

let diff;
try {
  diff = execSync('git diff --cached --unified=0 -- "*.ts" "*.tsx"', { encoding: 'utf8' });
} catch {
  process.exit(0); // git yoʻq — skip
}

const lines = diff.split('\n');
let currentFile = '';
const violations = [];

for (const line of lines) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.slice(6);
  }
  // Skip ignored files
  if (IGNORE_EXTENSIONS.some(ext => currentFile.endsWith(ext))) continue;
  // Only added lines
  if (line.startsWith('+') && !line.startsWith('+++')) {
    if (STUB_PATTERN.test(line)) {
      violations.push({ file: currentFile, line: line.slice(1).trim() });
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ notImplemented() taqiqlangan! Haqiqiy implementatsiya yozing:\n');
  for (const v of violations) {
    console.error(`  📄 ${v.file}`);
    console.error(`     ${v.line}\n`);
  }
  console.error('💡 Yechim: notImplemented() o\'rniga haqiqiy DB query yozing yoki EPComingSoon qaytaring.\n');
  process.exit(1);
}

console.log('✅ No new stubs found.');
