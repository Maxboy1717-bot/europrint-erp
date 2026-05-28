#!/usr/bin/env node
/**
 * check-sidebar-routes.mjs — Guard 3: Sidebar URL ↔ AppRouter Route Mapping
 *
 * Verifies that every clickable sidebar URL resolves to a registered route,
 * so the guard models what the app ACTUALLY renders rather than a stale
 * hand-maintained file list.
 *
 * HOW IT MIRRORS THE RUNNING APP (no more silent false positives):
 *  - Sidebar source: the canonical inline `menuGroups` in
 *    `components/sidebar/constants.ts`. That is the ONLY menuGroups consumed by
 *    the real sidebar components (ModuleTabs.tsx / MobileSidebar.tsx via
 *    getTranslatedMenuGroups). The per-domain `constants-*.ts` and
 *    `constants-groups-a/b.ts` exports are an abandoned refactor — unused — so
 *    reading them produced phantom gaps. We read constants.ts only.
 *  - Route source: every `*.tsx` under `src/routes/` is globbed (no stale
 *    hardcoded list). This auto-includes CRMRoutes / DirectorRoutes / StubRoutes
 *    and auto-drops files that no longer exist.
 *  - Matching: reproduces AppRouter's own `isKnownPath` — a path is known when
 *    it equals "/", matches a module-route tuple pattern (`:param`→`[^/]+`,
 *    `:rest*`→`.*`), or exactly equals a REDIRECT_PATHS / redirect-alias entry.
 *
 * INFORMATIONAL ONLY — does NOT block commits. A remaining "unrouted" line is a
 * genuine sidebar link with no route (a real gap), not a scanner artifact.
 *
 * Usage:
 *   node scripts/check-sidebar-routes.mjs            # summary output
 *   node scripts/check-sidebar-routes.mjs --verbose  # show all mismatches
 *   node scripts/check-sidebar-routes.mjs --all      # show all URLs checked
 *
 * Session 9 — EuroPrint ERP governance. Rewritten Session 17 (false-positive fix).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const showAll = process.argv.includes('--all');

const FE = 'artifacts/erp-dashboard/src';
const SIDEBAR_CONSTANTS = `${FE}/components/sidebar/constants.ts`;
const ROUTES_DIR = `${FE}/routes`;
// Shell files register a few top-level routes outside the *Routes.tsx tuples
// (e.g. App.tsx handles "/pos-monitor" via location.startsWith). Scan their
// bare "/path" string literals too so those are not reported as gaps.
const SHELL_FILES = [`${FE}/App.tsx`, `${ROUTES_DIR}/AppRouter.tsx`];

/** Strip query string and hash, then normalise to a single leading slash. */
function normalizePath(raw) {
  let p = raw.trim();
  if (!p) return '';
  p = p.split('?')[0].split('#')[0];
  if (!p) return '';
  return p.startsWith('/') ? p : '/' + p;
}

// ---------------------------------------------------------------------------
// 1. Sidebar URLs — canonical inline menuGroups in constants.ts
// ---------------------------------------------------------------------------
// Match `url: "some/path"` / `url: 'some/path'`. Separators use `url: ""` and
// are skipped (empty after normalise). Only menuGroups items carry a `url:`
// key, so scanning the whole file is safe (colour/permission maps use bg:/text:).
const URL_VALUE_RE = /\burl:\s*["'`]([^"'`]+)["'`]/g;

const sidebarUrls = new Set();
const sidebarAbs = join(root, SIDEBAR_CONSTANTS);
if (!existsSync(sidebarAbs)) {
  console.error(`[check-sidebar-routes] ERROR: canonical sidebar source not found: ${SIDEBAR_CONSTANTS}`);
  process.exit(0);
}
{
  const src = readFileSync(sidebarAbs, 'utf8');
  let m;
  while ((m = URL_VALUE_RE.exec(src)) !== null) {
    const url = normalizePath(m[1]);
    if (url && !/^https?:\/\//i.test(m[1])) sidebarUrls.add(url);
  }
}

// ---------------------------------------------------------------------------
// 2. Registered routes — every *.tsx under src/routes/ (no stale list)
// ---------------------------------------------------------------------------
// Pattern 1: ['/path', Component]  — tuple route arrays (the *Routes.tsx files)
const TUPLE_ROUTE_RE = /\[\s*['"`](\/[^'"`]+)['"`]\s*,/g;
// Pattern 2: path="/path"  — JSX Route props (AppRouter home/redirect aliases)
const JSX_ROUTE_RE = /\bpath=["'`](\/[^"'`]+)["'`]/g;
// Pattern 3: bare '/path' string literals — REDIRECT_PATHS array entries in
// AppRouter (and redirect `to=` targets, which are themselves real routes).
const STRING_PATH_RE = /["'`](\/[A-Za-z0-9][^"'`\s]*)["'`]/g;

const routePatterns = new Set(['/']); // home is always known

const routesDirAbs = join(root, ROUTES_DIR);
const routeFiles = existsSync(routesDirAbs)
  ? readdirSync(routesDirAbs).filter((f) => f.endsWith('.tsx')).map((f) => join(ROUTES_DIR, f))
  : [];
// Dedupe so AppRouter.tsx (in both lists) is scanned once.
const scanFiles = [...new Set([...routeFiles, ...SHELL_FILES])];

for (const relPath of scanFiles) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) continue;
  const src = readFileSync(abs, 'utf8');
  // Shell files (App.tsx, AppRouter.tsx) carry REDIRECT_PATHS / startsWith
  // route literals; data route files only carry tuples + JSX path props.
  const isShell = SHELL_FILES.some((s) => relPath.endsWith(s.split('/').pop()));

  let m;
  TUPLE_ROUTE_RE.lastIndex = 0;
  while ((m = TUPLE_ROUTE_RE.exec(src)) !== null) routePatterns.add(normalizePath(m[1]));
  JSX_ROUTE_RE.lastIndex = 0;
  while ((m = JSX_ROUTE_RE.exec(src)) !== null) routePatterns.add(normalizePath(m[1]));
  if (isShell) {
    STRING_PATH_RE.lastIndex = 0;
    while ((m = STRING_PATH_RE.exec(src)) !== null) routePatterns.add(normalizePath(m[1]));
  }
}

// ---------------------------------------------------------------------------
// 3. Match — reproduce AppRouter.pathMatches (`:param`→[^/]+, `:rest*`→.*)
// ---------------------------------------------------------------------------
function pathMatches(pattern, loc) {
  if (pattern === loc) return true;
  if (!pattern.includes(':')) return false; // no dynamic segment → exact only
  try {
    const regStr = '^' + pattern.replace(/:[^/]+\*/g, '.*').replace(/:[^/]+/g, '[^/]+') + '$';
    return new RegExp(regStr).test(loc);
  } catch {
    return false;
  }
}

const patternList = [...routePatterns];
function isKnownPath(loc) {
  return patternList.some((p) => pathMatches(p, loc));
}

const matched = [];
const unmatched = [];
for (const url of sidebarUrls) {
  (isKnownPath(url) ? matched : unmatched).push(url);
}
unmatched.sort();

// ---------------------------------------------------------------------------
// 4. Output
// ---------------------------------------------------------------------------
if (showAll) {
  console.log('\nAll sidebar URLs checked:');
  for (const u of [...sidebarUrls].sort()) {
    console.log(`  ${matched.includes(u) ? '✅' : '⚠️ '} ${u}`);
  }
  console.log();
}

if (unmatched.length > 0 && (verbose || showAll)) {
  console.warn('⚠️  Sidebar ↔ Route mapping gaps (informational):');
  for (const u of unmatched) {
    console.warn(`  WARN: sidebar URL "${u}" has no matching route (real gap or intentional stub)`);
  }
  console.warn();
}

const total = sidebarUrls.size;
console.log(
  `✅ Sidebar routes: ${matched.length}/${total} URLs matched` +
  (unmatched.length > 0 ? ` — ${unmatched.length} unrouted (run --verbose for detail)` : '') +
  ` [${patternList.length} route patterns from ${scanFiles.length} files]`,
);

// Guard 3 is informational — always exit 0
process.exit(0);
