#!/usr/bin/env node
/**
 * check-fe-antipatterns.mjs — Guard 2: Frontend Anti-pattern Scanner
 *
 * Catches recurring FE mistakes discovered in Sessions 7/8 audits:
 *   BLOCK  — HR pages calling /api/users instead of /api/hr/employees
 *   WARN   — Silent catch blocks (errors swallowed, impossible to debug)
 *   WARN   — Raw fetch() instead of apiRequest() (bypasses auth headers/interceptors)
 *
 * Usage:
 *   node scripts/check-fe-antipatterns.mjs            # pre-commit (exits 1 on BLOCK)
 *   node scripts/check-fe-antipatterns.mjs --verbose  # also print WARN detail
 *
 * Session 9 — EuroPrint ERP governance.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

const PAGES_DIR = join(root, 'artifacts/erp-dashboard/src/pages');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// File name fragments that identify HR-domain pages
const HR_PAGE_FRAGMENTS = [
  'Payroll', 'Applications', 'EmployeeTracking',
  'ERPDailyReports', 'LMSDashboard', 'HRDashboard',
  'HRCapital', 'HRCareer', 'HRConflict', 'HRAlumni',
  'HREnps', 'HRGamification', 'HRBirthdays', 'HRMilestones',
  'HRBrand', 'HRSafety', 'HRPip', 'HROnboarding', 'HROffboarding',
  'HRHealthMonitoring', 'HRAIDashboard', 'HRVacation',
  'HRSuccession', 'HRAsset', 'Employee', 'Employees',
  'RecruiterKPI', 'RecruitingKanban', 'Questionnaire', 'Adaptation',
  'ShiftSchedule', 'Discipline', 'Mentorship', 'SkillsMatrix',
];

// Files that are legitimately NOT in HR domain and may call /api/users
const EXCLUDED_FROM_API_CHECK = [
  'InventoryCount.tsx',
  'Login.tsx',
  'OTPVerify.tsx',
  'Settings.tsx',
  'AdminPanel.tsx',
  'UserManagement.tsx',
];

// Files exempt from raw fetch() warning (they implement the fetch layer itself)
const FETCH_WHITELIST = [
  'queryClient.ts',
  'queryClient.tsx',
  'api.ts',
  'httpClient.ts',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Walk a directory, returning all .tsx / .ts files */
function walkTs(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTs(full, out);
    } else if (st.isFile() && /\.(tsx|ts)$/.test(entry) && !/\.(spec|test)\.(tsx?|js)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function isHrPage(filePath) {
  const name = basename(filePath);
  return HR_PAGE_FRAGMENTS.some((frag) => name.includes(frag));
}

function isExcluded(filePath, list) {
  const name = basename(filePath);
  return list.some((ex) => name === ex);
}

/** Find all matches with line numbers; returns [{line, col, text}] */
function findMatches(src, re) {
  const matches = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip full-line comments
    if (/^\s*\/\//.test(line)) continue;
    if (re.test(line)) {
      re.lastIndex = 0; // reset stateful regex
      matches.push({ lineNo: i + 1, text: line.trim() });
    }
    re.lastIndex = 0;
  }
  return matches;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------
const files = walkTs(PAGES_DIR);

const blocks = [];  // severity BLOCK — commit halted
const warns  = [];  // severity WARN  — logged but commit proceeds

// --- A: /api/users in HR pages ---
const API_USERS_RE = /['"]\/api\/users['"]/;
for (const f of files) {
  if (!isHrPage(f)) continue;
  if (isExcluded(f, EXCLUDED_FROM_API_CHECK)) continue;
  const src = readFileSync(f, 'utf8');
  const hits = findMatches(src, API_USERS_RE);
  for (const h of hits) {
    blocks.push({
      file: relative(root, f),
      line: h.lineNo,
      rule: 'HR_WRONG_ENDPOINT',
      detail: '/api/users detected in HR page — use /api/hr/employees',
      text: h.text,
    });
  }
}

// --- B: Silent catch blocks ---
// Matches: catch (...) { } or catch (...) { // comment } with no real body
// Also catches: catch { } (no binding)
const SILENT_CATCH_RE = /catch\s*(\([^)]*\))?\s*\{\s*(\/\/[^\n]*)?\s*\}/;
const allSrcFiles = walkTs(join(root, 'artifacts/erp-dashboard/src'));
for (const f of allSrcFiles) {
  // Only pages + hooks + components (not locales, assets)
  const rel = relative(root, f);
  if (!rel.includes('src/pages') && !rel.includes('src/hooks') && !rel.includes('src/components')) continue;
  const src = readFileSync(f, 'utf8');
  const hits = findMatches(src, SILENT_CATCH_RE);
  for (const h of hits) {
    warns.push({
      file: rel,
      line: h.lineNo,
      rule: 'SILENT_CATCH',
      detail: 'Silent catch block — errors swallowed; use console.warn or rethrow',
      text: h.text,
    });
  }
}

// --- C: Raw fetch() usage ---
// Match fetch( not preceded by: //, word char (e.g. "prefetch(", "refetch(")
const RAW_FETCH_RE = /(?<![\/\w])fetch\s*\(/;
for (const f of allSrcFiles) {
  if (isExcluded(f, FETCH_WHITELIST)) continue;
  const rel = relative(root, f);
  if (!rel.includes('src/pages') && !rel.includes('src/hooks') && !rel.includes('src/lib')) continue;
  const src = readFileSync(f, 'utf8');
  const hits = findMatches(src, RAW_FETCH_RE);
  for (const h of hits) {
    warns.push({
      file: rel,
      line: h.lineNo,
      rule: 'RAW_FETCH',
      detail: 'Raw fetch() detected — use apiRequest() to ensure auth headers and error handling',
      text: h.text,
    });
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
let hasOutput = false;

if (blocks.length) {
  hasOutput = true;
  console.error('\n⚠️  FE Anti-patterns — BLOCKing violations:');
  for (const b of blocks) {
    console.error(`  [BLOCK] ${b.file}:${b.line}`);
    console.error(`          ${b.detail}`);
    if (verbose) console.error(`          > ${b.text}`);
  }
}

if (warns.length && verbose) {
  hasOutput = true;
  console.warn('\n⚠️  FE Anti-patterns — warnings (non-blocking):');
  for (const w of warns) {
    console.warn(`  [WARN]  ${w.file}:${w.line}`);
    console.warn(`          ${w.detail}`);
    console.warn(`          > ${w.text}`);
  }
}

if (!hasOutput && !blocks.length) {
  const warnCount = warns.length ? ` (${warns.length} warnings — run --verbose to see)` : '';
  console.log(`✅ FE anti-patterns: PASS${warnCount}`);
}

if (blocks.length) {
  console.error(`\n❌ FE anti-patterns: ${blocks.length} BLOCK — commit halted.`);
  console.error(`   Fix the BLOCK issues listed above, then re-commit.`);
  process.exit(1);
}

process.exit(0);
