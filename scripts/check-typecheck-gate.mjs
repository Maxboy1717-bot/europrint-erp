#!/usr/bin/env node
/**
 * Typecheck gate — runs pnpm typecheck only for workspaces
 * that have staged files in this commit.
 *
 * Workspace detection:
 *   - apps/api/**   → @europrint/api
 *   - artifacts/erp-dashboard/**  → erp-dashboard
 *   - lib/db/**     → @europrint/db (runs pnpm build, not typecheck)
 *
 * Called from .husky/pre-commit.
 * Bypass: git commit --no-verify
 */

import { execSync } from 'child_process';

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
}

function getStagedFiles() {
  return run('git diff --cached --name-only --diff-filter=ACMR', { silent: true })
    .trim()
    .split('\n')
    .filter(Boolean);
}

const staged = getStagedFiles();

if (staged.length === 0) process.exit(0);

const needsApiCheck = staged.some(f => f.startsWith('apps/api/'));
const needsFECheck  = staged.some(f => f.startsWith('artifacts/erp-dashboard/'));
const needsDbCheck  = staged.some(f => f.startsWith('lib/db/'));

let failed = false;

if (needsApiCheck) {
  console.log('🔍 Typecheck: apps/api ...');
  try {
    run('pnpm --filter @europrint/api typecheck');
    console.log('✅ apps/api typecheck passed');
  } catch {
    console.error('❌ apps/api typecheck FAILED — fix TypeScript errors before committing');
    failed = true;
  }
}

if (needsFECheck) {
  console.log('🔍 Typecheck: erp-dashboard ...');
  try {
    run('pnpm --filter erp-dashboard typecheck');
    console.log('✅ erp-dashboard typecheck passed');
  } catch {
    console.error('❌ erp-dashboard typecheck FAILED — fix TypeScript errors before committing');
    failed = true;
  }
}

if (needsDbCheck) {
  console.log('🔍 Build check: lib/db ...');
  try {
    run('pnpm --filter @europrint/db build');
    console.log('✅ lib/db build passed');
  } catch {
    console.error('❌ lib/db build FAILED — fix errors before committing');
    failed = true;
  }
}

if (failed) {
  console.error('\n💡 Bypass (use only if you have a good reason): git commit --no-verify');
  process.exit(1);
}
