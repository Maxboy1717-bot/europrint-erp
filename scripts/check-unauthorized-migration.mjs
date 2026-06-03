#!/usr/bin/env node
/**
 * check-unauthorized-migration.mjs — Q-35 governance guard (WARN, non-blocking).
 *
 * Warns when a STAGED change adds a `CREATE TABLE` (new schema / migration) but the file has
 * no `APPROVED:` marker — table creation requires explicit owner permission (Q-35). The
 * marker is a comment the owner / executor adds once approval is given, e.g.
 *   -- APPROVED: owner 2026-06-03  (or // APPROVED: ...)
 *
 * Diff-aware ratchet: only staged added CREATE TABLE lines are scanned, so existing
 * migrations are never re-flagged. Always exits 0 (advisory).
 *
 * Rule source: CLAUDE.md Q-35 (table creation = owner permission).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SKIP = [/scripts[\\/]check-/i, /\.spec\./i, /__tests__/i, /[\\/]fixtures[\\/]/i];

let diff = '';
try {
  diff = execSync('git diff --cached --unified=0', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  diff = (e.stdout || '').toString();
}

const CREATE = /^\+.*\bCREATE\s+TABLE\b/i;
const filesWithCreate = new Set();
let file = null;
for (const raw of diff.split('\n')) {
  if (raw.startsWith('+++ ')) { file = raw.replace(/^\+\+\+ b\//, '').trim(); continue; }
  if (CREATE.test(raw) && file && file !== '/dev/null' && !SKIP.some((re) => re.test(file))) {
    filesWithCreate.add(file);
  }
}

if (!filesWithCreate.size) {
  console.log('check-unauthorized-migration: no new CREATE TABLE staged.');
  process.exit(0);
}

const warns = [];
for (const f of filesWithCreate) {
  let content = '';
  try { content = readFileSync(f, 'utf8'); } catch { /* ignore */ }
  if (!/APPROVED:/i.test(content)) warns.push(f);
}

if (warns.length) {
  console.warn('\n⚠️  Q-35 check-unauthorized-migration: new CREATE TABLE without owner-approval marker:');
  for (const f of warns) console.warn(`   ${f} — add an "APPROVED: <owner/date>" comment once the owner approves the table.`);
  console.warn('   Table creation requires explicit owner permission (Q-35).\n');
} else {
  console.log('check-unauthorized-migration: new CREATE TABLE(s) carry an APPROVED marker.');
}
process.exit(0);
