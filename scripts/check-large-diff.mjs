#!/usr/bin/env node
/**
 * check-large-diff.mjs — Q-28 governance guard (WARN, non-blocking).
 *
 * Warns when a single STAGED commit is large (> MAX_FILES files or > MAX_LINES changed
 * lines) — a reminder that big changes should go through plan + owner permission (Q-28).
 * Always exits 0 (advisory only). Lock/snapshot/dist/min files are excluded from the count.
 *
 * Rule source: CLAUDE.md Q-28 (permission gate before changes).
 */
import { execSync } from 'node:child_process';

const MAX_FILES = 15;
const MAX_LINES = 500;
const SKIP = [
  /pnpm-lock\.yaml$/, /package-lock\.json$/, /yarn\.lock$/, /\.lock$/,
  /\.snap$/, /[\\/]dist[\\/]/, /\.min\.(js|css)$/,
];

let out = '';
try {
  out = execSync('git diff --cached --numstat', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  out = (e.stdout || '').toString();
}

let files = 0;
let lines = 0;
for (const row of out.split('\n')) {
  if (!row.trim()) continue;
  const parts = row.split('\t');
  const added = parts[0];
  const removed = parts[1];
  const file = parts.slice(2).join('\t');
  if (!file || SKIP.some((re) => re.test(file))) continue;
  files++;
  lines += (added === '-' ? 0 : parseInt(added, 10) || 0) + (removed === '-' ? 0 : parseInt(removed, 10) || 0);
}

if (files > MAX_FILES || lines > MAX_LINES) {
  console.warn(`\n⚠️  Q-28 check-large-diff: large staged change (${files} files, ${lines} lines).`);
  console.warn('   Reminder: big changes should go through plan + owner permission (Q-28).');
  console.warn(`   Thresholds: > ${MAX_FILES} files or > ${MAX_LINES} lines. Split into smaller commits if possible.\n`);
} else {
  console.log(`check-large-diff: ${files} files, ${lines} lines (within limits).`);
}
process.exit(0);
