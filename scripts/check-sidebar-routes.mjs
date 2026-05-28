#!/usr/bin/env node
/**
 * check-sidebar-routes.mjs — Guard 3: Sidebar URL ↔ AppRouter Route Mapping
 *
 * Reads all sidebar menuGroups URLs from constants-groups-a/b.ts and verifies
 * that each non-separator, non-empty URL has a corresponding <Route path=...>
 * in the FE route files (*Routes.tsx, AppRouter.tsx).
 *
 * INFORMATIONAL ONLY — does NOT block commits.
 * Some sidebar items intentionally point to stub/coming-soon pages that have
 * no real route yet. This guard surfaces gaps for developer awareness.
 *
 * Usage:
 *   node scripts/check-sidebar-routes.mjs            # summary output
 *   node scripts/check-sidebar-routes.mjs --verbose  # show all mismatches
 *   node scripts/check-sidebar-routes.mjs --all      # show all URLs checked
 *
 * Session 9 — EuroPrint ERP governance.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const showAll = process.argv.includes('--all');

// ---------------------------------------------------------------------------
// 1. Extract sidebar URLs from constants-groups-a/b.ts
// ---------------------------------------------------------------------------
const CONSTANTS_FILES = [
  'artifacts/erp-dashboard/src/components/sidebar/constants-groups-a.ts',
  'artifacts/erp-dashboard/src/components/sidebar/constants-groups-b.ts',
];

// Match:  url: "some/path"  or  url: 'some/path'
// Also ignore separators (url: "" or url: '', separator: true)
const URL_VALUE_RE = /\burl:\s*["'`]([^"'`]+)["'`]/g;

const sidebarUrls = new Set();

for (const relPath of CONSTANTS_FILES) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) {
    console.warn(`[check-sidebar-routes] WARN: constants file not found: ${relPath}`);
    continue;
  }
  const src = readFileSync(abs, 'utf8');
  let m;
  URL_VALUE_RE.lastIndex = 0;
  while ((m = URL_VALUE_RE.exec(src)) !== null) {
    const url = m[1].trim();
    if (url) sidebarUrls.add(url);
  }
  URL_VALUE_RE.lastIndex = 0;
}

// ---------------------------------------------------------------------------
// 2. Extract declared routes from all *Routes.tsx + AppRouter.tsx
// ---------------------------------------------------------------------------
const ROUTE_FILES = [
  'artifacts/erp-dashboard/src/routes/AppRouter.tsx',
  'artifacts/erp-dashboard/src/routes/HRRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/FinanceRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/SalesRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/WarehouseRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/ProductionRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/AdminRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/AnalyticsRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/DesignRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/CameraRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/TechRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/PosRoutes.tsx',
  'artifacts/erp-dashboard/src/routes/LmsRoutes.tsx',
];

// Pattern 1: ['/path', Component]  — tuple route arrays
const TUPLE_ROUTE_RE = /\[\s*['"`](\/[^'"`]+)['"`]\s*,/g;
// Pattern 2: path="/path"  — JSX Route props
const JSX_ROUTE_RE = /\bpath=["'`](\/[^"'`]+)["'`]/g;

const routePaths = new Set();

for (const relPath of ROUTE_FILES) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) continue;
  const src = readFileSync(abs, 'utf8');

  let m;
  TUPLE_ROUTE_RE.lastIndex = 0;
  while ((m = TUPLE_ROUTE_RE.exec(src)) !== null) {
    routePaths.add(m[1]);
  }
  JSX_ROUTE_RE.lastIndex = 0;
  while ((m = JSX_ROUTE_RE.exec(src)) !== null) {
    routePaths.add(m[1]);
  }
}

// ---------------------------------------------------------------------------
// 3. Compare
// ---------------------------------------------------------------------------
const matched = [];
const unmatched = [];

for (const url of sidebarUrls) {
  // Sidebar URLs are relative (no leading /); routes have leading /
  const routePath = '/' + url;
  // Exact match or prefix match for dynamic segments e.g. /employees/:id
  const found =
    routePaths.has(routePath) ||
    // Accept if any route starts with the same path (e.g. /org-structure/hierarchy/node/:id)
    [...routePaths].some((r) => {
      // Strip dynamic segments for comparison: /foo/:id → /foo
      const base = r.replace(/\/:[^/]+/g, '');
      return base === routePath || r === routePath;
    });

  if (found) {
    matched.push(url);
  } else {
    unmatched.push(url);
  }
}

// ---------------------------------------------------------------------------
// 4. Output
// ---------------------------------------------------------------------------
if (showAll) {
  console.log('\nAll sidebar URLs checked:');
  for (const u of [...sidebarUrls].sort()) {
    const icon = matched.includes(u) ? '✅' : '⚠️ ';
    console.log(`  ${icon} ${u}`);
  }
  console.log();
}

if (unmatched.length > 0 && (verbose || showAll)) {
  console.warn('⚠️  Sidebar ↔ Route mapping gaps (informational):');
  for (const u of unmatched) {
    console.warn(`  WARN: sidebar URL "${u}" has no matching route in route files`);
    console.warn(`        (may be a stub/coming-soon page — that is OK)`);
  }
  console.warn();
}

const total = sidebarUrls.size;
const matchedCount = matched.length;
const unmatchedCount = unmatched.length;

console.log(
  `✅ Sidebar routes: ${matchedCount}/${total} URLs matched` +
  (unmatchedCount > 0 ? ` — ${unmatchedCount} unrouted (run --verbose for detail)` : ''),
);

// Guard 3 is informational — always exit 0
process.exit(0);
