#!/usr/bin/env node
/**
 * audit-pages-map.mjs — build a complete map of:
 *   1. Frontend routes → page components → API calls they make
 *   2. Backend controllers → endpoints → which file
 *   3. Cross-reference: which endpoints have callers, which pages have backends
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/pages');
const ROUTES_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/routes');
const API_DIR = path.join(ROOT, 'apps/api/src/modules');

function* walk(dir, ext = '.tsx') {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '__tests__') continue;
      yield* walk(full, ext);
    } else if (e.isFile() && full.endsWith(ext)) {
      yield full;
    }
  }
}

// ─── PART 1: Frontend routes → components ─────────────────────────────
const routes = []; // {url, component, page, file}
for (const rf of fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.tsx'))) {
  const content = fs.readFileSync(path.join(ROUTES_DIR, rf), 'utf8');
  // const Component = lazy(() => import('@/pages/Path'))
  const lazyMap = {};
  for (const m of content.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]@\/pages\/([^'"]+)['"]\)\)/g)) {
    lazyMap[m[1]] = m[2];
  }
  // ['/path', Component] or <Route path="/path" component={Component}/>
  for (const m of content.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\]/g)) {
    const page = lazyMap[m[2]];
    if (page) routes.push({ url: m[1], component: m[2], page, file: rf });
  }
}
console.log(`Routes: ${routes.length}`);

// ─── PART 2: For each page component, find API calls inside ──────────
const pageApiCalls = {};
for (const page of routes) {
  const pagePath = path.join(PAGES_DIR, `${page.page}.tsx`);
  if (!fs.existsSync(pagePath)) {
    pageApiCalls[page.page] = { missing: true };
    continue;
  }
  const content = fs.readFileSync(pagePath, 'utf8');
  // Find /api/... patterns
  const apis = new Set();
  // Helper: collapse interpolations and drop urls with unresolved nested
  // template literals (e.g. `/api/budgets${qs ? `?${qs}` : ''}` is ambiguous —
  // the nested backtick closes the outer regex early and produces a malformed
  // URL like `/api/budgets${qs ?`. Skip those.
  const sanitize = (raw) => {
    if (!raw.startsWith('/api/')) return null;
    // Replace `${...}` interpolations with `:id` placeholder
    let u = raw.replace(/\$\{[^}]+\}/g, ':id');
    // After replacement, if a `${` remains, the URL was malformed — skip.
    if (u.includes('${')) return null;
    // Strip query string for matching purposes (handled by Query in NestJS)
    u = u.replace(/\?.*$/, '');
    // If `:id` appears NOT after a `/` (e.g. `/api/foo:id` from a nested
    // template like `/api/foo${qs ? ...}`), drop everything from that point —
    // the real call is the path up to that point.
    u = u.replace(/([^/]):id.*$/, '$1');
    return u;
  };
  for (const m of content.matchAll(/['"`](\/api\/[a-zA-Z0-9\-_/${}:?=&]+)['"`]/g)) {
    const u = sanitize(m[1]);
    if (u) apis.add(u);
  }
  // Also pick up TS template literals like `/api/foo/${id}`. Use a non-greedy
  // match that stops at the first non-template backtick, but tolerates nested
  // `${ ... }` chunks by consuming them whole.
  for (const m of content.matchAll(/`(\/api\/(?:[^`$]|\$\{[^}]*\})+)`/g)) {
    const u = sanitize(m[1]);
    if (u) apis.add(u);
  }
  pageApiCalls[page.page] = { apis: [...apis] };
}

// ─── PART 3: Backend controllers → endpoints ──────────────────────────
// One file may contain MULTIPLE @Controller classes — process each separately.
const endpoints = []; // {method, url, controller, file, hasAuth, hasZod}
for (const f of walk(API_DIR, '.ts')) {
  if (!f.includes('.controller.ts')) continue;
  if (f.includes('.spec.ts') || f.includes('.test.ts')) continue;
  const content = fs.readFileSync(f, 'utf8');

  // Split file by @Controller decorators to handle multi-class files.
  // Match all forms: @Controller(), @Controller('foo'), @Controller({path:'foo'}),
  // @Controller(['foo', 'bar']).
  const ctrlPositions = [];
  const ctrlRe = /@Controller\s*\(\s*(?:\[\s*['"]([^'"]+)['"]|['"]([^'"]*)['"]|\{\s*path:\s*['"]([^'"]*)['"]|\s*\))/g;
  let cm;
  while ((cm = ctrlRe.exec(content))) {
    const prefix = (cm[1] ?? cm[2] ?? cm[3] ?? '').replace(/^\//, '').replace(/\/$/, '');
    ctrlPositions.push({ start: cm.index, prefix });
  }
  if (ctrlPositions.length === 0) continue;

  // For each @Controller block, find its endpoints (between this @Controller and the next)
  for (let i = 0; i < ctrlPositions.length; i++) {
    const { start, prefix } = ctrlPositions[i];
    const end = i + 1 < ctrlPositions.length ? ctrlPositions[i + 1].start : content.length;
    const block = content.slice(start, end);
    const ctrlHasAuth = /@UseGuards\([^)]*JwtAuthGuard/.test(block.slice(0, 500));

    const methodRe = /@(Get|Post|Put|Patch|Delete)\(\s*(?:\[\s*['"]([^'"]+)['"]|['"]([^'"]*)['"])?[^)]*\)\s*(?:[^@]|@(?!Get|Post|Put|Patch|Delete))*?\s*(?:async\s+)?(\w+)\s*\(/g;
    let m;
    while ((m = methodRe.exec(block))) {
      const method = m[1].toUpperCase();
      const subPath = m[2] ?? m[3] ?? '';
      const fnName = m[4];
      const url = `/api/${prefix}${subPath ? '/' + subPath.replace(/^\//, '') : ''}`.replace(/\/+/g, '/');

      const before200 = block.slice(Math.max(0, m.index - 200), m.index);
      const isPublic = /@Public\(\)/.test(before200);
      const localGuard = /@UseGuards\([^)]*JwtAuthGuard/.test(before200);

      const fnBodyEnd = block.indexOf('@', m.index + m[0].length);
      const fnBody = block.slice(m.index, fnBodyEnd > 0 ? fnBodyEnd : m.index + 2000);
      const hasZod = /\.parse\(|\.safeParse\(|ZodSchema|z\.object/.test(fnBody);

      endpoints.push({
        method, url, controller: path.basename(f, '.ts'), file: path.relative(ROOT, f),
        hasAuth: ctrlHasAuth || localGuard || isPublic,
        isPublic, hasZod,
      });
    }
  }
}
console.log(`Endpoints: ${endpoints.length}`);

// ─── PART 4: Cross-reference ──────────────────────────────────────────
// Normalize endpoint URL for matching (replace :id with placeholder).
// Strip query strings — backend endpoints declare path only; query params are
// handled inside the handler via @Query() and do not affect routing.
// Include underscore in param name capture so `:badge_number` collapses to `:param`
// (otherwise the trailing `_number` survives and breaks the match).
const normalizeUrl = (u) =>
  u.replace(/\?.*$/, '')
   .replace(/:[a-zA-Z_]+/g, ':param')
   .toLowerCase();

const endpointsByUrl = new Map();
for (const e of endpoints) {
  const key = normalizeUrl(e.url);
  if (!endpointsByUrl.has(key)) endpointsByUrl.set(key, []);
  endpointsByUrl.get(key).push(e);
}

// For each page, check which API calls are met
const pageReports = [];
for (const route of routes) {
  const calls = pageApiCalls[route.page]?.apis ?? [];
  const apiStatus = calls.map(u => {
    const key = normalizeUrl(u);
    return { url: u, exists: endpointsByUrl.has(key) };
  });
  const missing = apiStatus.filter(s => !s.exists).map(s => s.url);
  const fileExists = !pageApiCalls[route.page]?.missing;
  pageReports.push({
    route: route.url,
    page: route.page,
    fileExists,
    apiCallCount: calls.length,
    missingApis: missing,
    file: route.file,
  });
}

// For each endpoint, check if any frontend page calls it
const endpointsCalled = new Set();
for (const r of pageReports) {
  if (r.apiCallCount > 0) {
    for (const url of (pageApiCalls[r.page]?.apis ?? [])) {
      endpointsCalled.add(normalizeUrl(url));
    }
  }
}
// Also scan whole frontend src for /api/ refs (some calls might be in shared components)
const allFrontendApiCalls = new Set();
for (const f of walk(path.join(ROOT, 'artifacts/erp-dashboard/src'), '.tsx')) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/['"`](\/api\/[a-zA-Z0-9\-_/${}:]+)/g)) {
    allFrontendApiCalls.add(normalizeUrl(m[1].replace(/\$\{[^}]+\}/g, ':param')));
  }
}
for (const f of walk(path.join(ROOT, 'artifacts/erp-dashboard/src'), '.ts')) {
  const c = fs.readFileSync(f, 'utf8');
  for (const m of c.matchAll(/['"`](\/api\/[a-zA-Z0-9\-_/${}:]+)/g)) {
    allFrontendApiCalls.add(normalizeUrl(m[1].replace(/\$\{[^}]+\}/g, ':param')));
  }
}

const orphanEndpoints = [];
for (const e of endpoints) {
  if (!allFrontendApiCalls.has(normalizeUrl(e.url))) {
    orphanEndpoints.push(e);
  }
}

// ─── PART 5: Save reports ────────────────────────────────────────────
const summary = {
  totalRoutes: routes.length,
  totalEndpoints: endpoints.length,
  pagesWithMissingFile: pageReports.filter(p => !p.fileExists).length,
  pagesWithNoApi: pageReports.filter(p => p.apiCallCount === 0).length,
  pagesWithBrokenApi: pageReports.filter(p => p.missingApis.length > 0).length,
  endpointsWithoutAuth: endpoints.filter(e => !e.hasAuth).length,
  endpointsWithoutZod: endpoints.filter(e => (e.method === 'POST' || e.method === 'PATCH' || e.method === 'PUT') && !e.hasZod).length,
  orphanEndpoints: orphanEndpoints.length,
  uniqueFrontendApiCalls: allFrontendApiCalls.size,
};

console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(summary, null, 2));

fs.writeFileSync('audit-page-reports.json', JSON.stringify(pageReports, null, 2));
fs.writeFileSync('audit-endpoints.json', JSON.stringify(endpoints, null, 2));
fs.writeFileSync('audit-orphan-endpoints.json', JSON.stringify(orphanEndpoints, null, 2));
fs.writeFileSync('audit-summary.json', JSON.stringify(summary, null, 2));
console.log('\nSaved: audit-page-reports.json, audit-endpoints.json, audit-orphan-endpoints.json, audit-summary.json');
