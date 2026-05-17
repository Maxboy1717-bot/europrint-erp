#!/usr/bin/env node
/**
 * HR module audit script.
 *
 * Currently implements the `sidebar-duplicates` check:
 *   scans every sidebar source file for the known duplicate pairs and
 *   reports PASS only when each pair has exactly one canonical entry
 *   AND the legacy alias is either absent OR registered as a redirect.
 *
 * Usage:
 *   node scripts/hr-audit.mjs --check=sidebar-duplicates
 *   node scripts/hr-audit.mjs --summary
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SIDEBAR_FILES = [
  'artifacts/erp-dashboard/src/components/AppSidebar.tsx',
  'artifacts/erp-dashboard/src/components/dizayn-new/AppSidebar.tsx',
  'artifacts/erp-dashboard/src/components/sidebar/constants.ts',
  'artifacts/erp-dashboard/src/components/Layout.tsx',
];

const ROUTE_FILES = [
  'artifacts/erp-dashboard/src/routes/HRRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/StubRoutes.tsx',
];

const REDIRECT_FILE = 'artifacts/erp-dashboard/src/routes/AppRouter.tsx';

/** Duplicate path pairs: [legacy, canonical]. */
const DUPLICATE_PAIRS = [
  { legacy: '/hr/succession-planning', canonical: '/hr/succession' },
  { legacy: '/hr/leave',               canonical: '/hr/vacation-sick' },
];

function readIfExists(rel) {
  const full = resolve(repoRoot, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function hasSidebarEntry(content, path) {
  // Sidebar config uses URLs without leading slash (e.g. "hr/succession"),
  // legacy Layout.tsx uses "/hr/succession" with slash. Cover both.
  const noSlash = path.replace(/^\//, '');
  const escNoSlash = noSlash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match: "<noSlash>" surrounded by quotes (sidebar URLs)
  // or:    "<path>" surrounded by quotes (Layout hrefs)
  const re = new RegExp(`["'\`](/?)${escNoSlash}["'\`]`, 'g');
  return re.test(content);
}

function hasRouteEntry(content, path) {
  // Match exact path in single or double quotes
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`["'\`]${esc}["'\`]`, 'g');
  return re.test(content);
}

function hasRedirectFor(content, legacy, canonical) {
  // Looks for: path="<legacy>" ... Redirect to="<canonical>"
  const escL = legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escC = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`path="${escL}"[\\s\\S]{0,400}?Redirect\\s+to="${escC}"`);
  return re.test(content);
}

function checkSidebarDuplicates() {
  const failures = [];
  const notes = [];

  const sidebarBlob = SIDEBAR_FILES.map(readIfExists).join('\n');
  const routeBlob = ROUTE_FILES.map(readIfExists).join('\n');
  const redirectContent = readIfExists(REDIRECT_FILE);

  for (const { legacy, canonical } of DUPLICATE_PAIRS) {
    const sidebarHasLegacy = hasSidebarEntry(sidebarBlob, legacy);
    const sidebarHasCanonical = hasSidebarEntry(sidebarBlob, canonical);
    const routeHasLegacy = hasRouteEntry(routeBlob, legacy);
    const routeHasCanonical = hasRouteEntry(routeBlob, canonical);
    const redirected = hasRedirectFor(redirectContent, legacy, canonical);

    if (sidebarHasLegacy) {
      failures.push(
        `sidebar still references legacy path "${legacy}" — should use "${canonical}"`,
      );
    }
    if (!sidebarHasCanonical) {
      failures.push(
        `sidebar missing canonical path "${canonical}" — was the page removed?`,
      );
    }
    if (routeHasLegacy) {
      failures.push(
        `route table still maps "${legacy}" — should be a redirect, not a route`,
      );
    }
    if (!routeHasCanonical) {
      failures.push(
        `route table missing canonical "${canonical}" — was the route removed?`,
      );
    }
    if (!redirected) {
      failures.push(
        `AppRouter.tsx missing wouter Redirect for "${legacy}" -> "${canonical}"`,
      );
    } else {
      notes.push(`redirect OK: ${legacy} -> ${canonical}`);
    }
  }

  return { name: 'sidebar-duplicates', failures, notes };
}

function reportResult(result) {
  const status = result.failures.length === 0 ? 'PASS' : 'FAIL';
  // eslint-disable-next-line no-console
  console.log(`[hr-audit] ${result.name}: ${status}`);
  for (const note of result.notes) {
    // eslint-disable-next-line no-console
    console.log(`  · ${note}`);
  }
  for (const failure of result.failures) {
    // eslint-disable-next-line no-console
    console.log(`  ! ${failure}`);
  }
  return status === 'PASS' ? 0 : 1;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.find((a) => a.startsWith('--check='))?.split('=')[1];
  const summary = args.includes('--summary');

  const results = [];
  if (summary || !check || check === 'sidebar-duplicates') {
    results.push(checkSidebarDuplicates());
  }
  if (check && check !== 'sidebar-duplicates') {
    // eslint-disable-next-line no-console
    console.error(`Unknown check: ${check}`);
    process.exit(2);
  }

  let exitCode = 0;
  for (const r of results) {
    exitCode |= reportResult(r);
  }
  process.exit(exitCode);
}

main();
