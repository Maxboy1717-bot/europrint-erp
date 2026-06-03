#!/usr/bin/env node
/**
 * check-no-secret-print.mjs — Q-30 governance guard (BLOCK).
 *
 * Blocks a commit when a STAGED change adds source code that exposes a secret VALUE:
 *   A) a hardcoded secret literal   e.g. const JWT_SECRET = 'real-value-here'
 *   B) printing a secret variable   e.g. console.log(`...` + apiKey) / `${apiKey}`
 *
 * Diff-aware ratchet: only STAGED added lines in source files are scanned, so existing
 * code is never re-flagged. Name-only mentions (console.log('JWT_SECRET missing')) are NOT
 * flagged — only value exposure. Escape hatch: append `// allow-secret` to the line.
 *
 * Rule source: CLAUDE.md Q-30 (a subagent once printed a full JWT_SECRET value).
 */
import { execSync } from 'node:child_process';

// Files the guard never scans (its own family + tests/fixtures/examples carry these tokens).
const SKIP = [
  /scripts[\\/]check-/i,
  /\.spec\./i, /\.test\./i, /__tests__/i, /[\\/](fixtures|__fixtures__)[\\/]/i,
  /\.example\b/i,
];

const SECRET_NAMES =
  '(?:JWT_SECRET|JWT_REFRESH_SECRET|REFRESH_SECRET|API_?KEY|SECRET_KEY|PRIVATE_?KEY|' +
  'ACCESS_?TOKEN|REFRESH_?TOKEN|DB_PASSWORD|ADMIN_SEED_PASSWORD|PASSWORD|PASSWD)';
const SECRET_IN_EXPR =
  '(?:SECRET|PASSWORD|PASSWD|API_?KEY|PRIVATE_?KEY|ACCESS_?TOKEN|REFRESH_?TOKEN|JWT_SECRET)';

// A) secret name assigned a quoted literal of >= 8 chars
const PATTERN_A = new RegExp(SECRET_NAMES + "\\s*[:=]\\s*['\"`]([^'\"`]{8,})['\"`]", 'i');
// B) a print statement that emits a secret variable via interpolation or concatenation
const PRINT = '(?:console\\.(?:log|error|warn|info|debug|trace)|logger\\.\\w+|process\\.std(?:out|err)\\.write)';
const PATTERN_B_INTERP = new RegExp(PRINT + '\\s*\\([^)]*\\$\\{[^}]*' + SECRET_IN_EXPR + '[^}]*\\}', 'i');
const PATTERN_B_CONCAT = new RegExp(PRINT + "\\s*\\([^)]*\\+\\s*[\\w.$\\[\\]'\"]*" + SECRET_IN_EXPR, 'i');

let diff = '';
try {
  diff = execSync(
    'git diff --cached --unified=0 -- "*.ts" "*.tsx" "*.js" "*.mjs" "*.cjs"',
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
} catch (e) {
  diff = (e.stdout || '').toString();
}

const violations = [];
let file = null;
let newLine = 0;
for (const raw of diff.split('\n')) {
  if (raw.startsWith('+++ ')) { file = raw.replace(/^\+\+\+ b\//, '').trim(); continue; }
  if (raw.startsWith('@@')) {
    const m = raw.match(/\+(\d+)/);
    newLine = m ? parseInt(m[1], 10) : newLine;
    continue;
  }
  if (raw.startsWith('+') && !raw.startsWith('+++')) {
    const content = raw.slice(1);
    const lineNo = newLine++;
    if (!file || SKIP.some((re) => re.test(file))) continue;
    if (/\/\/\s*allow-secret/i.test(content)) continue;
    let reason = null;
    if (PATTERN_A.test(content)) reason = 'hardcoded secret literal';
    else if (PATTERN_B_INTERP.test(content) || PATTERN_B_CONCAT.test(content)) reason = 'prints a secret value';
    if (reason) violations.push({ file, lineNo, reason, content: content.trim().slice(0, 140) });
  }
}

if (violations.length) {
  console.error('\n\u{1F534} Q-30 check-no-secret-print: secret value exposure in staged changes (BLOCKED)\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.lineNo}  [${v.reason}]`);
    console.error(`    + ${v.content}`);
  }
  console.error('\n  Fix: never hardcode or print a secret value. Read it via ConfigService/env at use-site.');
  console.error('  False positive? Append "// allow-secret" to the line.\n');
  process.exit(1);
}
console.log('✅ check-no-secret-print: no secret exposure in staged changes.');
process.exit(0);
