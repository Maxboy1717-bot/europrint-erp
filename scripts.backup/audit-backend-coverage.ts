/**
 * Backend Coverage Audit Script
 * Checks backend routes that exist but are NOT covered in the frontend
 * (no API call, no page route, no nav link, no tab referencing them).
 *
 * Direction: backend → frontend  (opposite of audit-api-endpoints.ts)
 *
 * Usage: pnpm tsx scripts/audit-backend-coverage.ts
 * Output: scripts/backend-coverage-report.txt
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const FRONTEND_DIR  = path.resolve('artifacts/erp-dashboard/src');
const BACKEND_DIR   = path.resolve('apps/api/src/modules');
const GLOBAL_PREFIX = 'api';
const REPORT_FILE   = path.resolve('scripts/backend-coverage-report.txt');

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BackendRoute {
  file: string;
  module: string;
  method: string;
  path: string;
  normalized: string;
}

interface FrontendCoverage {
  apiCalls: Set<string>;       // normalized /api/... paths from fetch/apiRequest/etc.
  pageRoutes: Set<string>;     // path values from *Routes.tsx files
  navLinks: Set<string>;       // href/to/<Link paths
  tabValues: Set<string>;      // <Tab value= attributes (any path-like or keyword value)
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function walkDir(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Normalize a URL/path for matching:
 * - Replace ${...} template expressions with *
 * - Replace :param segments with *
 * - Replace numeric IDs with *
 * - Remove query strings
 * - Lowercase, remove trailing slash
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/\$\{[^}]+\}/g, '*')
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '*')
    .replace(/\/\d+(?=\/|$)/g, '/*')
    .replace(/\?.*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .trim();
}

/**
 * Wildcard segment match: * on either side matches any segment.
 */
function urlMatches(a: string, b: string): boolean {
  if (a === b) return true;
  const ap = a.split('/').filter(Boolean);
  const bp = b.split('/').filter(Boolean);
  if (ap.length !== bp.length) return false;
  return ap.every((s, i) => s === bp[i] || s === '*' || bp[i] === '*');
}

/**
 * Derive module name from a controller file path.
 * e.g. apps/api/src/modules/hr/presentation/employees.controller.ts → "hr"
 */
function moduleFromControllerFile(filePath: string): string {
  const rel = filePath.replace(/\\/g, '/');
  const match = rel.match(/\/modules\/([^/]+)\//);
  return match ? match[1] : 'other';
}

// ─── STEP 1: EXTRACT BACKEND ROUTES ──────────────────────────────────────────

function extractBackendRoutes(): BackendRoute[] {
  const routes: BackendRoute[] = [];
  const files = walkDir(BACKEND_DIR, ['.controller.ts']);
  const httpMethods = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');
    const mod = moduleFromControllerFile(rel);

    // Build position-indexed controller entries so files with multiple classes
    // (each with its own @Controller()) are handled correctly.
    const controllerEntries: { pos: number; base: string }[] = [];
    {
      const ctrlRe = /@Controller\s*\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`|\{\s*path\s*:\s*(?:'([^']*)'|"([^"]*)")\s*\})\s*\)/g;
      let c: RegExpExecArray | null;
      while ((c = ctrlRe.exec(content)) !== null) {
        const raw = (c[1] ?? c[2] ?? c[3] ?? c[4] ?? c[5] ?? '').replace(/^\/+|\/+$/g, '').replace(/^api\//, '');
        controllerEntries.push({ pos: c.index, base: raw });
      }
      if (controllerEntries.length === 0 && content.includes('@Controller(')) {
        controllerEntries.push({ pos: 0, base: '' });
      }
    }

    // Return the controller base for the class that precedes `methodPos`
    const getControllerBase = (methodPos: number): string => {
      const ctrl = controllerEntries.filter(e => e.pos <= methodPos).at(-1);
      return ctrl?.base ?? controllerEntries[0]?.base ?? '';
    };

    // Extract method-level routes (position-aware, handles multi-class files)
    for (const method of httpMethods) {
      const methodRegex = new RegExp(
        `@${method}\\s*\\(\\s*(?:'([^']*)'|"([^"]*)"|` + '`([^`]*)`' + `|\\{\\s*path\\s*:\\s*(?:'([^']*)'|"([^"]*)")\\s*\\})?\\s*\\)`,
        'g'
      );
      let mm: RegExpExecArray | null;
      while ((mm = methodRegex.exec(content)) !== null) {
        const methodPath = mm[1] ?? mm[2] ?? mm[3] ?? mm[4] ?? mm[5] ?? '';
        const controllerBase = getControllerBase(mm.index);
        const segments = [GLOBAL_PREFIX, controllerBase, methodPath]
          .map(s => s.replace(/^\/+|\/+$/g, ''))
          .filter(Boolean);
        const fullPath = '/' + segments.join('/');
        const normalized = normalizeUrl(fullPath);

        routes.push({ file: rel, module: mod, method: method.toUpperCase(), path: fullPath, normalized });
      }
    }
  }

  return routes;
}

// ─── STEP 2: EXTRACT FRONTEND COVERAGE ───────────────────────────────────────

function extractFrontendCoverage(): FrontendCoverage {
  const apiCalls  = new Set<string>();
  const pageRoutes = new Set<string>();
  const navLinks  = new Set<string>();
  const tabValues = new Set<string>();

  const allFiles = walkDir(FRONTEND_DIR, ['.tsx', '.ts']);

  // ── 2a. API call patterns ──────────────────────────────────────────────────
  const apiPatterns: RegExp[] = [
    /fetch\s*\(\s*[`'"](\/api\/[^`'")\s]*)[`'"]/g,
    /queryKey\s*:\s*\[\s*[`'"](\/api\/[^`'"\]]*)[`'"]/g,
    /\burl\s*:\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    /(?:^|[^a-zA-Z0-9_$])[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    /`(\/api\/[^`]*)`/g,
    // apiRequest('METHOD', '/api/...')  or  apiRequest("METHOD", `/api/...`)
    /apiRequest\s*\(\s*[`'"]\w+[`'"]\s*,\s*[`'"]([^`'"]+)[`'"]/g,
    // axios.get('/api/...') axios.post(...)
    /axios\s*\.\s*(?:get|post|put|patch|delete)\s*\(\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    // useQuery / useMutation with string URL
    /use(?:Query|Mutation)\s*\(\s*\{[^}]*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
  ];

  for (const file of allFiles) {
    const trimmedPath = file.replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('import ') || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

      for (const pat of apiPatterns) {
        pat.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pat.exec(line)) !== null) {
          const raw = m[1];
          if (!raw || !raw.startsWith('/api/')) continue;
          apiCalls.add(normalizeUrl(raw));
        }
      }
    }

    // ── 2b. Page routes from *Routes.tsx files ──────────────────────────────
    if (trimmedPath.includes('/routes/') && trimmedPath.endsWith('Routes.tsx')) {
      // path: '/some/path'  or  ['/some/path',  (tuple first element)
      const routePatterns: RegExp[] = [
        /\[\s*['"`](\/[^'"`]+)['"`]\s*,/g,
        /path\s*:\s*['"`](\/[^'"`]+)['"`]/g,
      ];
      for (const pat of routePatterns) {
        pat.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pat.exec(content)) !== null) {
          pageRoutes.add(normalizeUrl(m[1]));
        }
      }
    }

    // ── 2c. Nav links: href=, to=, <Link ────────────────────────────────────
    const navPatterns: RegExp[] = [
      /\bhref\s*=\s*[`'"](\/[^`'")\s]*)[`'"]/g,
      /\bto\s*=\s*[`'"](\/[^`'")\s]*)[`'"]/g,
      /<Link[^>]+(?:href|to)\s*=\s*[`'"](\/[^`'")\s]*)[`'"]/g,
    ];
    for (const pat of navPatterns) {
      pat.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.exec(content)) !== null) {
        const v = m[1];
        if (v && v.startsWith('/')) navLinks.add(normalizeUrl(v));
      }
    }

    // ── 2d. Tab values ───────────────────────────────────────────────────────
    // Collect ALL value= attributes from <Tab> and <TabsTrigger> elements,
    // plus any standalone value= that looks like a path or keyword referencing
    // a module/feature. This captures both path-like (/employees) and keyword
    // (employees, overview, attendance) tab identifiers.
    const tabElPatterns: RegExp[] = [
      // <Tab value="something"> or <TabsTrigger value="something">
      /<(?:Tab|TabsTrigger)\b[^>]*\bvalue\s*=\s*[`'"]([^`'">\s]+)[`'"]/g,
    ];
    for (const pat of tabElPatterns) {
      pat.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.exec(content)) !== null) {
        const v = m[1];
        if (v) tabValues.add(v.toLowerCase().trim());
      }
    }
    // Also capture any standalone /api/... value= references (direct API tab navigation)
    const apiValuePat = /\bvalue\s*=\s*[`'"](\/api\/[^`'")\s,]+)[`'"]/g;
    apiValuePat.lastIndex = 0;
    let avm: RegExpExecArray | null;
    while ((avm = apiValuePat.exec(content)) !== null) {
      const v = avm[1];
      if (v) tabValues.add(normalizeUrl(v));
    }
  }

  return { apiCalls, pageRoutes, navLinks, tabValues };
}

// ─── STEP 3: CHECK COVERAGE ───────────────────────────────────────────────────

interface CoverageResult {
  route: BackendRoute;
  coveredBy: string[];
}

function checkCoverage(route: BackendRoute, cov: FrontendCoverage): string[] {
  const covered: string[] = [];

  // ── 1. API calls (primary — direct backend usage, all HTTP methods) ──────────
  for (const call of cov.apiCalls) {
    if (urlMatches(route.normalized, call)) {
      covered.push(`API call: ${call}`);
      break;
    }
  }

  // ── 2. Tab values that are direct /api/... paths (all HTTP methods) ──────────
  //    These are explicit API path references found in tab value= attributes.
  if (covered.length === 0) {
    for (const tv of cov.tabValues) {
      if (tv.startsWith('/api/') && urlMatches(route.normalized, tv)) {
        covered.push(`Tab value (API path): ${tv}`);
        break;
      }
    }
  }

  // ── 3. For GET routes ONLY: also match page routes, nav links, page-path tabs ─
  //    (a page being navigable implies its GET data endpoints are used;
  //     this heuristic is NOT applied to POST/PUT/PATCH/DELETE to avoid
  //     false-coverage of mutating endpoints)
  if (covered.length === 0 && route.method === 'GET') {
    // Derive page path by stripping /api prefix from the route
    const withoutApi = route.normalized.replace(/^\/api/, '');

    for (const pr of cov.pageRoutes) {
      if (urlMatches(withoutApi, pr) || urlMatches(route.normalized, pr)) {
        covered.push(`Page route: ${pr}`);
        break;
      }
    }

    if (covered.length === 0) {
      for (const nl of cov.navLinks) {
        if (urlMatches(withoutApi, nl) || urlMatches(route.normalized, nl)) {
          covered.push(`Nav link: ${nl}`);
          break;
        }
      }
    }

    // Tab values — two sub-strategies:
    // a) Path-like tab values (start with /) matched against withoutApi or normalized
    // b) Keyword tab values (e.g. "employees") matched against the last segment(s)
    //    of the backend route path
    if (covered.length === 0) {
      const routeLastSegment = route.normalized.split('/').filter(Boolean).pop() ?? '';
      for (const tv of cov.tabValues) {
        if (tv.startsWith('/api/') || tv.startsWith('/')) continue; // handled above
        // keyword match: tab value equals or is contained in the route's last segment
        if (routeLastSegment && (tv === routeLastSegment || routeLastSegment.startsWith(tv))) {
          covered.push(`Tab value (keyword): ${tv}`);
          break;
        }
        // also check against withoutApi segments (e.g. tab "employees" vs /hr/employees)
        const withoutApiSegs = withoutApi.split('/').filter(Boolean);
        if (withoutApiSegs.some(seg => seg === tv)) {
          covered.push(`Tab value (keyword): ${tv}`);
          break;
        }
      }
    }
  }

  return covered;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('📡 Backend routlari skanerlanmoqda...');
  const backendRoutes = extractBackendRoutes();
  console.log(`   ${backendRoutes.length} ta backend route topildi`);

  console.log('🔍 Frontend qamrovi skanerlanmoqda...');
  const coverage = extractFrontendCoverage();
  console.log(`   ${coverage.apiCalls.size} ta API chaqiruvi`);
  console.log(`   ${coverage.pageRoutes.size} ta sahifa route`);
  console.log(`   ${coverage.navLinks.size} ta nav link`);
  console.log(`   ${coverage.tabValues.size} ta tab qiymati`);

  console.log('🔄 Qamrov tekshirilmoqda...');

  const covered: CoverageResult[]   = [];
  const uncovered: CoverageResult[] = [];
  // Map normalized key → coveredBy evidence, used in full route listing
  const coveredByMap = new Map<string, string[]>();

  for (const route of backendRoutes) {
    const coveredBy = checkCoverage(route, coverage);
    const key = `${route.method}:${route.normalized}`;
    if (coveredBy.length > 0) {
      covered.push({ route, coveredBy });
      coveredByMap.set(key, coveredBy);
    } else {
      uncovered.push({ route, coveredBy: [] });
    }
  }

  // Group uncovered by module
  const byModule = new Map<string, CoverageResult[]>();
  for (const r of uncovered) {
    const mod = r.route.module;
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod)!.push(r);
  }

  const sortedModules = [...byModule.keys()].sort();

  // Group all routes by module for the full list
  const allByModule = new Map<string, BackendRoute[]>();
  for (const r of backendRoutes) {
    if (!allByModule.has(r.module)) allByModule.set(r.module, []);
    allByModule.get(r.module)!.push(r);
  }

  // ── BUILD REPORT ────────────────────────────────────────────────────────────

  const lines: string[] = [];
  const W = 80;

  lines.push('═'.repeat(W));
  lines.push('BACKEND COVERAGE AUDIT HISOBOTI  (backend → frontend)');
  lines.push(`Sana: ${new Date().toISOString()}`);
  lines.push('═'.repeat(W));
  lines.push('');
  lines.push('XULOSA:');
  lines.push(`  Jami backend routlar               : ${backendRoutes.length}`);
  lines.push(`  Frontendda qamrab olinganlar        : ${covered.length}`);
  lines.push(`  Frontendda QAMLANMAGAN routlar      : ${uncovered.length}  ← ASOSIY`);
  lines.push(`  Qamlanmagan modullar soni            : ${sortedModules.length}`);
  lines.push(`  Qamlov darajasi                     : ${backendRoutes.length > 0 ? ((covered.length / backendRoutes.length) * 100).toFixed(1) : '100.0'}%`);
  lines.push('');
  lines.push('Frontend qamrov manbalari:');
  lines.push(`  API chaqiruvlar (/api/... URL)       : ${coverage.apiCalls.size}`);
  lines.push(`  Sahifa routlari (*Routes.tsx)         : ${coverage.pageRoutes.size}`);
  lines.push(`  Nav linklar (href/to/<Link)           : ${coverage.navLinks.size}`);
  lines.push(`  Tab qiymatlari (<Tab value=)          : ${coverage.tabValues.size}`);
  lines.push('');

  // ── Uncovered routes grouped by module ──────────────────────────────────────
  lines.push('─'.repeat(W));
  lines.push('FRONTENDDA QAMLANMAGAN ROUTLAR (Modul bo\'yicha guruhlanган):');
  lines.push('─'.repeat(W));
  lines.push('');

  for (const mod of sortedModules) {
    const group = byModule.get(mod)!;
    const label = mod.toUpperCase();
    lines.push(`┌── ${label} (${group.length} ta) ${'─'.repeat(Math.max(0, W - 8 - label.length))}`);
    for (const { route } of group) {
      lines.push(`│   ${route.method.padEnd(7)} ${route.path}`);
      lines.push(`│   Fayl: ${route.file}`);
      lines.push(`│`);
    }
    lines.push('');
  }

  // ── Full backend route list by module ────────────────────────────────────────
  lines.push('─'.repeat(W));
  lines.push('BARCHA BACKEND ROUTLAR (Modul bo\'yicha):');
  lines.push('─'.repeat(W));
  lines.push('');

  for (const [mod, routes] of [...allByModule.entries()].sort()) {
    const total = routes.length;
    const covCount = routes.filter(r => coveredByMap.has(`${r.method}:${r.normalized}`)).length;
    lines.push(`  [${mod.toUpperCase()}]  — ${covCount}/${total} qamlab olingan`);
    for (const r of routes) {
      const key = `${r.method}:${r.normalized}`;
      const evidence = coveredByMap.get(key);
      const mark = evidence ? '✓' : '✗';
      lines.push(`    ${mark} ${r.method.padEnd(7)} ${r.path}`);
      if (evidence) {
        for (const e of evidence) {
          lines.push(`        → ${e}`);
        }
      }
    }
    lines.push('');
  }

  const report = lines.join('\n');
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');

  // ── CONSOLE SUMMARY ──────────────────────────────────────────────────────────

  console.log('');
  console.log('═'.repeat(60));
  console.log('XULOSA:');
  console.log(`  Jami backend routlar         : ${backendRoutes.length}`);
  console.log(`  Frontendda qamrab olinganlar  : ${covered.length}`);
  console.log(`  Frontendda QAMLANMAGAN        : ${uncovered.length}`);
  console.log(`  Qamlov darajasi               : ${backendRoutes.length > 0 ? ((covered.length / backendRoutes.length) * 100).toFixed(1) : '100.0'}%`);
  console.log('═'.repeat(60));
  console.log('');

  if (uncovered.length > 0) {
    console.log(`⚠️  ${uncovered.length} ta backend route frontendda qamlanmagan:`);
    console.log('');
    for (const mod of sortedModules) {
      const group = byModule.get(mod)!;
      console.log(`  [${mod.toUpperCase()}] — ${group.length} ta:`);
      for (const { route } of group.slice(0, 5)) {
        console.log(`    • ${route.method.padEnd(7)} ${route.path}`);
        console.log(`      ${route.file}`);
      }
      if (group.length > 5) {
        console.log(`    ... va yana ${group.length - 5} ta`);
      }
      console.log('');
    }
  } else {
    console.log('✅ Barcha backend routlar frontendda qamlab olingan!');
  }

  console.log(`📄 To'liq hisobot: ${REPORT_FILE}`);
}

main();
