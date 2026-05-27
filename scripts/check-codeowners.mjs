#!/usr/bin/env node
/**
 * CODEOWNERS Local Pre-commit Guard
 * ----------------------------------
 * Maqsad: Kritik fayllar (auth, finance domain, hr commands, DB schema,
 * migrations) faqat owner tomonidan o'zgartirilishi mumkin.
 *
 * CODEOWNERS dagi qaysi qatorlar shu pre-commit guard'ida ishlatilishini
 * `# 🛡️ LOCAL-CRITICAL-GUARD` marker comment'i ostidagi qatorlar
 * belgilaydi. Marker yo'q bo'lsa — hech narsa bloklanmaydi.
 *
 * Owner email — atrof-muhit yoki configdan o'qiladi:
 *   1. env: CODEOWNER_EMAIL
 *   2. CODEOWNERS faylida `# OWNER_EMAIL=<email>` marker
 *   3. fallback: muslimbeknosirov1995@gmail.com
 *
 * Bypass: `git commit --no-verify` (avariya holatida).
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const CODEOWNERS_PATH = '.github/CODEOWNERS';
const MARKER = '🛡️ LOCAL-CRITICAL-GUARD';
const FALLBACK_OWNER = 'muslimbeknosirov1995@gmail.com';

if (!existsSync(CODEOWNERS_PATH)) process.exit(0);

const content = readFileSync(CODEOWNERS_PATH, 'utf8');
const lines = content.split('\n');

// Owner email aniqlaymiz
let ownerEmail = process.env.CODEOWNER_EMAIL || FALLBACK_OWNER;
for (const line of lines) {
  const m = line.match(/^#\s*OWNER_EMAIL\s*=\s*(\S+)/i);
  if (m) {
    ownerEmail = m[1];
    break;
  }
}

// LOCAL-CRITICAL-GUARD marker ostidagi qatorlarni o'qiymiz
const criticalPatterns = [];
let inGuardBlock = false;
for (const raw of lines) {
  const line = raw.trim();
  if (!line) {
    // bo'sh qator block'ni tugatadi
    if (inGuardBlock) inGuardBlock = false;
    continue;
  }
  if (line.startsWith('#')) {
    if (line.includes(MARKER)) inGuardBlock = true;
    continue;
  }
  if (!inGuardBlock) continue;
  // path/glob owner — faqat path qismi
  const [pattern] = line.split(/\s+/);
  if (pattern) criticalPatterns.push(pattern);
}

if (criticalPatterns.length === 0) process.exit(0);

// Joriy author email
let currentEmail = '';
try {
  currentEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
} catch {
  process.exit(0); // git config yo'q — sukut
}

if (currentEmail.toLowerCase() === ownerEmail.toLowerCase()) {
  process.exit(0); // owner o'zi — OK
}

// Staged fayllar
let stagedRaw = '';
try {
  stagedRaw = execSync('git diff --cached --name-only', { encoding: 'utf8' });
} catch {
  process.exit(0);
}
const stagedFiles = stagedRaw.trim().split('\n').filter(Boolean);
if (stagedFiles.length === 0) process.exit(0);

// Pattern → fayl moslashtirish (oddiy prefix moslashish, glob emas)
const matchesPattern = (file, pattern) => {
  const p = pattern.replace(/^\//, '').replace(/\/$/, '');
  if (p.includes('*')) {
    // *.sql kabi
    const ext = p.replace(/^\*\./, '');
    return file.endsWith('.' + ext);
  }
  return file === p || file.startsWith(p + '/');
};

const violations = [];
for (const file of stagedFiles) {
  const matched = criticalPatterns.filter((p) => matchesPattern(file, p));
  if (matched.length > 0) violations.push({ file, matched });
}

if (violations.length === 0) process.exit(0);

console.error('');
console.error('❌ CODEOWNERS LOCAL GUARD: Quyidagi fayllar kritik va owner roziligini talab qiladi.');
console.error('');
console.error(`   Joriy author: ${currentEmail}`);
console.error(`   Owner:        ${ownerEmail}`);
console.error('');
console.error('Bloklangan fayllar:');
for (const v of violations) {
  console.error(`  📄 ${v.file}`);
  for (const p of v.matched) {
    console.error(`     pattern: ${p}`);
  }
}
console.error('');
console.error('💡 To\'g\'risi: PR oching va owner review so\'rang.');
console.error('   Avariya holatida: `git commit --no-verify` (tarix saqlanadi).');
console.error('');
process.exit(1);
