/**
 * FULL SYSTEM AUDIT SCRIPT
 * ========================
 * Eng to'liq daraja: backendda mavjud lekin frontendda hech nima yo'q routlarni,
 * frontendda chaqirilgan lekin backendda yo'q routlarni, buttonsiz sahifalarni,
 * APIga ulanmagan buttonlarni va boshqa barcha muammolarni tekshiradi.
 *
 * Tekshiruv yo'nalishlari:
 *   1. Backend → Frontend  : Route bor, lekin sahifa/nav/tab/button/API yo'q
 *   2. Frontend → Backend  : API chaqiruv bor, lekin backend route yo'q (404 xavfi)
 *   3. Mutation coverage   : POST/PUT/PATCH/DELETE → frontend button ulangan-ulganmagan
 *   4. Page health         : Sahifada button bor-yo'q, API chaqiruv bor-yo'q
 *   5. Umumiy statistika
 *
 * Ishga tushirish: pnpm tsx scripts/audit-full-system.ts
 * Hisobot: scripts/full-system-audit-report.txt
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const FRONTEND_DIR  = path.resolve('artifacts/erp-dashboard/src');
const BACKEND_DIR   = path.resolve('apps/api/src/modules');
const PAGES_DIR     = path.resolve('artifacts/erp-dashboard/src/pages');
const GLOBAL_PREFIX = 'api';
const REPORT_FILE   = path.resolve('scripts/full-system-audit-report.txt');

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BackendRoute {
  file: string;
  module: string;
  method: string;
  path: string;
  normalized: string;
}

interface FrontendApiCall {
  file: string;
  line: number;
  url: string;
  normalized: string;
  confidence: 'high' | 'low';
}

interface PageStat {
  file: string;
  name: string;
  hasButton: boolean;
  hasOnClick: boolean;
  hasOnSubmit: boolean;
  hasMutation: boolean;
  hasApiCall: boolean;
  onClickCount: number;
  onSubmitCount: number;
  mutationCount: number;
  apiCalls: { method: string; path: string; normalized: string }[];
}

interface BackendCoverage {
  route: BackendRoute;
  /** Bevosita API chaqiruv topildi */
  byApiCall: string | null;
  /** Sahifa route orqali (GET uchun) */
  byPageRoute: string | null;
  /** Nav link orqali (GET uchun) */
  byNavLink: string | null;
  /** Tab qiymati orqali */
  byTabValue: string | null;
  /** Frontend button/mutation orqali (POST/PUT/PATCH/DELETE uchun) */
  byButton: string | null;
  /** Umumiy qamrov darajasi */
  level: 'FULL' | 'PARTIAL' | 'NONE';
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function walkDir(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full, exts));
    else if (exts.some(e => entry.name.endsWith(e))) results.push(full);
  }
  return results;
}

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

function urlMatches(a: string, b: string): boolean {
  if (a === b) return true;
  const ap = a.split('/').filter(Boolean);
  const bp = b.split('/').filter(Boolean);
  if (ap.length !== bp.length) return false;
  return ap.every((s, i) => s === bp[i] || s === '*' || bp[i] === '*');
}

function moduleFromControllerFile(filePath: string): string {
  const rel = filePath.replace(/\\/g, '/');
  const m = rel.match(/\/modules\/([^/]+)\//);
  return m ? m[1] : 'other';
}

function rel(p: string): string {
  return path.relative(process.cwd(), p);
}

// ─── STEP 1: EXTRACT BACKEND ROUTES ──────────────────────────────────────────

function extractBackendRoutes(): BackendRoute[] {
  const routes: BackendRoute[] = [];
  const files = walkDir(BACKEND_DIR, ['.controller.ts']);
  const httpMethods = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const mod = moduleFromControllerFile(rel(file));

    // Build a map of controller positions → controller path (to handle multi-controller files)
    const ctrlPositions: { index: number; path: string }[] = [];
    const ctrlRegex = /@Controller\s*\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`|\{\s*path\s*:\s*(?:'([^']*)'|"([^"]*)")\s*\})\s*\)/g;
    let cm: RegExpExecArray | null;
    while ((cm = ctrlRegex.exec(content)) !== null) {
      const p = cm[1] ?? cm[2] ?? cm[3] ?? cm[4] ?? cm[5] ?? '';
      ctrlPositions.push({ index: cm.index, path: p });
    }
    if (ctrlPositions.length === 0 && content.includes('@Controller(')) {
      ctrlPositions.push({ index: 0, path: '' });
    }
    if (ctrlPositions.length === 0) continue;

    // Helper: find the controller path active at a given character position
    function activeControllerAt(pos: number): string {
      let active = ctrlPositions[0].path;
      for (const c of ctrlPositions) {
        if (c.index <= pos) active = c.path;
        else break;
      }
      return active.replace(/^\/+|\/+$/g, '').replace(/^api\//, '');
    }

    // Helper: extract all method paths from a decorator argument (handles arrays too)
    function extractMethodPaths(argStr: string): string[] {
      if (!argStr) return [''];
      // Array form: ['path1', "path2", ...]
      const arrMatch = argStr.match(/^\s*\[([^\]]*)\]/);
      if (arrMatch) {
        const inner = arrMatch[1];
        const paths: string[] = [];
        const strRe = /(?:'([^']*)'|"([^"]*)")/g;
        let sm: RegExpExecArray | null;
        while ((sm = strRe.exec(inner)) !== null) {
          paths.push(sm[1] ?? sm[2] ?? '');
        }
        return paths.length > 0 ? paths : [''];
      }
      // Single string form: 'path', "path", or `path`
      const singleMatch = argStr.match(/^(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/);
      if (singleMatch) return [singleMatch[1] ?? singleMatch[2] ?? singleMatch[3] ?? ''];
      // Object form: { path: 'value' }
      const objMatch = argStr.match(/\{\s*path\s*:\s*(?:'([^']*)'|"([^"]*)")\s*\}/);
      if (objMatch) return [objMatch[1] ?? objMatch[2] ?? ''];
      return [''];
    }

    for (const method of httpMethods) {
      // Capture the entire decorator argument (stops at the closing paren at decorator level)
      const methodRegex = new RegExp(`@${method}\\s*\\(([^)]*)\\)`, 'g');
      let mm: RegExpExecArray | null;
      while ((mm = methodRegex.exec(content)) !== null) {
        const controllerBase = activeControllerAt(mm.index);
        const methodPaths = extractMethodPaths(mm[1]);
        for (const methodPath of methodPaths) {
          const segments = [GLOBAL_PREFIX, controllerBase, methodPath]
            .map(s => s.replace(/^\/+|\/+$/g, '')).filter(Boolean);
          const fullPath = '/' + segments.join('/');
          const norm = normalizeUrl(fullPath);
          if (!routes.some(r => r.normalized === norm && r.method === method.toUpperCase())) {
            routes.push({ file: rel(file), module: mod, method: method.toUpperCase(), path: fullPath, normalized: norm });
          }
        }
      }
    }
  }
  return routes;
}

// ─── STEP 2: EXTRACT FRONTEND API CALLS ──────────────────────────────────────

function extractFrontendApiCalls(): FrontendApiCall[] {
  const calls: FrontendApiCall[] = [];
  const files = walkDir(FRONTEND_DIR, ['.tsx', '.ts']);
  const patterns: RegExp[] = [
    /fetch\s*\(\s*[`'"](\/api\/[^`'")\s]*)[`'"]/g,
    /queryKey\s*:\s*\[\s*[`'"](\/api\/[^`'"\]]*)[`'"]/g,
    /\burl\s*:\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    /(?:^|[^a-zA-Z0-9_$])[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    /`(\/api\/[^`]*)`/g,
    /apiRequest\s*\(\s*[`'"]\w+[`'"]\s*,\s*[`'"]([^`'"]+)[`'"]/g,
    /axios\s*\.\s*(?:get|post|put|patch|delete)\s*\(\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('import ') || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      for (const pat of patterns) {
        pat.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pat.exec(line)) !== null) {
          const raw = m[1];
          if (!raw || !raw.startsWith('/api/')) continue;
          const normalized = normalizeUrl(raw);
          const isLow = /\$\{[^}]*\?/.test(raw) || /\$\{[^}]*&&/.test(raw) || raw.endsWith('${') || raw.includes('${queryString') || raw.includes('${params');
          const confidence: 'high' | 'low' = isLow ? 'low' : 'high';
          if (!calls.some(c => c.file === rel(file) && c.line === i + 1 && c.normalized === normalized)) {
            calls.push({ file: rel(file), line: i + 1, url: raw, normalized, confidence });
          }
        }
      }
    }
  }
  return calls;
}

// ─── STEP 3: EXTRACT ALL FRONTEND SIGNALS ────────────────────────────────────

interface FrontendSignals {
  apiCallNorms: Set<string>;
  pageRoutes: Set<string>;
  navLinks: Set<string>;
  tabValues: Set<string>;
  /** Normalized mutation paths from buttons/apiRequest in pages */
  mutationPaths: Set<string>;
}

function extractFrontendSignals(): FrontendSignals {
  const apiCallNorms  = new Set<string>();
  const pageRoutes    = new Set<string>();
  const navLinks      = new Set<string>();
  const tabValues     = new Set<string>();
  const mutationPaths = new Set<string>();

  const allFiles = walkDir(FRONTEND_DIR, ['.tsx', '.ts']);

  const apiPatterns: RegExp[] = [
    /fetch\s*\(\s*[`'"](\/api\/[^`'")\s]*)[`'"]/g,
    /queryKey\s*:\s*\[\s*[`'"](\/api\/[^`'"\]]*)[`'"]/g,
    /\burl\s*:\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    /(?:^|[^a-zA-Z0-9_$])[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    /`(\/api\/[^`]*)`/g,
    /apiRequest\s*\(\s*[`'"]\w+[`'"]\s*,\s*[`'"]([^`'"]+)[`'"]/g,
    /axios\s*\.\s*(?:get|post|put|patch|delete)\s*\(\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
  ];

  // apiRequest with explicit mutating methods
  const mutationApiPat = /apiRequest\s*\(\s*['"`](POST|PUT|PATCH|DELETE)['"`]\s*,\s*[`'"]([^`'"]+)[`'"]/g;
  // axios mutating
  const axiosMutPat = /axios\s*\.\s*(post|put|patch|delete)\s*\(\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g;
  // useMutation with mutationFn calling an api path
  const useMutApiPat = /useMutation[^{]*\{[^}]*[`'"](\/api\/[^`'")\s,]*)[`'"]/g;

  for (const file of allFiles) {
    const filePath = file.replace(/\\/g, '/');
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
          if (raw && raw.startsWith('/api/')) apiCallNorms.add(normalizeUrl(raw));
        }
      }
    }

    // Mutation paths — apiRequest with POST/PUT/PATCH/DELETE
    mutationApiPat.lastIndex = 0;
    let mm: RegExpExecArray | null;
    while ((mm = mutationApiPat.exec(content)) !== null) {
      if (mm[2] && mm[2].startsWith('/api/')) mutationPaths.add(normalizeUrl(mm[2]));
    }
    // axios mutating
    axiosMutPat.lastIndex = 0;
    let am: RegExpExecArray | null;
    while ((am = axiosMutPat.exec(content)) !== null) {
      if (am[2] && am[2].startsWith('/api/')) mutationPaths.add(normalizeUrl(am[2]));
    }
    // useMutation with api path
    useMutApiPat.lastIndex = 0;
    let um: RegExpExecArray | null;
    while ((um = useMutApiPat.exec(content)) !== null) {
      if (um[1] && um[1].startsWith('/api/')) mutationPaths.add(normalizeUrl(um[1]));
    }

    // Page routes from *Routes.tsx files
    if (filePath.includes('/routes/') && filePath.endsWith('Routes.tsx')) {
      const routePatterns: RegExp[] = [
        /\[\s*['"`](\/[^'"`]+)['"`]\s*,/g,
        /path\s*:\s*['"`](\/[^'"`]+)['"`]/g,
      ];
      for (const pat of routePatterns) {
        pat.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pat.exec(content)) !== null) pageRoutes.add(normalizeUrl(m[1]));
      }
    }

    // Nav links
    const navPatterns: RegExp[] = [
      /\bhref\s*=\s*[`'"](\/[^`'")\s]*)[`'"]/g,
      /\bto\s*=\s*[`'"](\/[^`'")\s]*)[`'"]/g,
    ];
    for (const pat of navPatterns) {
      pat.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.exec(content)) !== null) {
        if (m[1] && m[1].startsWith('/')) navLinks.add(normalizeUrl(m[1]));
      }
    }

    // Tab values — collect all string values from <Tab> and <TabsTrigger>
    const tabPat = /<(?:Tab|TabsTrigger)\b[^>]*\bvalue\s*=\s*[`'"]([^`'">\s]+)[`'"]/g;
    tabPat.lastIndex = 0;
    let tv: RegExpExecArray | null;
    while ((tv = tabPat.exec(content)) !== null) {
      if (tv[1]) tabValues.add(tv[1].toLowerCase().trim());
    }
    // Also /api/... value= attributes
    const apiValPat = /\bvalue\s*=\s*[`'"](\/api\/[^`'")\s,]+)[`'"]/g;
    apiValPat.lastIndex = 0;
    let av: RegExpExecArray | null;
    while ((av = apiValPat.exec(content)) !== null) {
      if (av[1]) tabValues.add(normalizeUrl(av[1]));
    }
  }

  return { apiCallNorms, pageRoutes, navLinks, tabValues, mutationPaths };
}

// ─── STEP 4: SCAN PAGE STATS ─────────────────────────────────────────────────

function extractPageStats(): PageStat[] {
  const stats: PageStat[] = [];
  const files = walkDir(PAGES_DIR, ['.tsx']);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const name = path.relative(PAGES_DIR, file);

    const hasButton   = /<Button[\s>/]/.test(content);
    const hasOnClick  = /\bonClick\b/.test(content);
    const hasOnSubmit = /\bonSubmit\b/.test(content);
    const hasMutation = /\buseMutation\b/.test(content);
    const hasApiCall  = /\bapiRequest\b/.test(content) || /fetch\s*\(/.test(content) || /useQuery\b/.test(content) || /axios\s*\./.test(content);

    const onClickCount  = (content.match(/\bonClick\b/g) || []).length;
    const onSubmitCount = (content.match(/\bonSubmit\b/g) || []).length;
    const mutationCount = (content.match(/\buseMutation\b/g) || []).length;

    const apiCallRegex = /apiRequest\s*\(\s*["'`]([A-Z]+)["'`]\s*,\s*`([^`]+)`|apiRequest\s*\(\s*["'`]([A-Z]+)["'`]\s*,\s*["']([^"']+)["']/g;
    const apiCalls: { method: string; path: string; normalized: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = apiCallRegex.exec(content)) !== null) {
      const method = m[1] || m[3];
      const rawPath = m[2] || m[4];
      if (method && rawPath) {
        apiCalls.push({ method, path: rawPath, normalized: normalizeUrl(rawPath) });
      }
    }

    stats.push({ file: rel(file), name, hasButton, hasOnClick, hasOnSubmit, hasMutation, hasApiCall, onClickCount, onSubmitCount, mutationCount, apiCalls });
  }

  return stats;
}

// ─── STEP 5: ANALYZE BACKEND COVERAGE ────────────────────────────────────────

function analyzeCoverage(route: BackendRoute, sig: FrontendSignals): BackendCoverage {
  let byApiCall:   string | null = null;
  let byPageRoute: string | null = null;
  let byNavLink:   string | null = null;
  let byTabValue:  string | null = null;
  let byButton:    string | null = null;

  // 1. Direct API call match (all methods)
  for (const c of sig.apiCallNorms) {
    if (urlMatches(route.normalized, c)) { byApiCall = c; break; }
  }

  // 2. Mutation button match (POST/PUT/PATCH/DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method)) {
    for (const mp of sig.mutationPaths) {
      if (urlMatches(route.normalized, mp)) { byButton = mp; break; }
    }
  }

  // 3. Tab values with /api/ path (all methods)
  if (!byApiCall && !byButton) {
    for (const tv of sig.tabValues) {
      if (tv.startsWith('/api/') && urlMatches(route.normalized, tv)) {
        byTabValue = tv; break;
      }
    }
  }

  // 4. GET-only: page route, nav link, keyword tab
  if (route.method === 'GET' && !byApiCall && !byTabValue) {
    const withoutApi = route.normalized.replace(/^\/api/, '');

    for (const pr of sig.pageRoutes) {
      if (urlMatches(withoutApi, pr) || urlMatches(route.normalized, pr)) {
        byPageRoute = pr; break;
      }
    }

    if (!byPageRoute) {
      for (const nl of sig.navLinks) {
        if (urlMatches(withoutApi, nl) || urlMatches(route.normalized, nl)) {
          byNavLink = nl; break;
        }
      }
    }

    // Keyword tab matching against route path segments
    if (!byPageRoute && !byNavLink) {
      const routeSegs = route.normalized.split('/').filter(Boolean);
      const lastSeg = routeSegs[routeSegs.length - 1] ?? '';
      for (const tv of sig.tabValues) {
        if (tv.startsWith('/api/') || tv.startsWith('/')) continue;
        if (lastSeg && (tv === lastSeg || lastSeg.startsWith(tv))) {
          byTabValue = tv; break;
        }
        const withoutApiSegs = withoutApi.split('/').filter(Boolean);
        if (withoutApiSegs.some(s => s === tv)) {
          byTabValue = tv; break;
        }
      }
    }
  }

  const hasAnyCoverage = byApiCall || byPageRoute || byNavLink || byTabValue || byButton;
  const hasDirectCoverage = byApiCall || byButton;
  const level: 'FULL' | 'PARTIAL' | 'NONE' = hasDirectCoverage ? 'FULL'
    : hasAnyCoverage ? 'PARTIAL'
    : 'NONE';

  return { route, byApiCall, byPageRoute, byNavLink, byTabValue, byButton, level };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('═'.repeat(70));
  console.log('  TO\'LIQ TIZIM TEKSHIRUVI  (Full System Audit)');
  console.log('═'.repeat(70));
  console.log('');

  console.log('📡 Backend routlari skanerlanmoqda...');
  const backendRoutes = extractBackendRoutes();
  console.log(`   ${backendRoutes.length} ta backend route`);

  console.log('🔍 Frontend signallari skanerlanmoqda...');
  const signals = extractFrontendSignals();
  console.log(`   ${signals.apiCallNorms.size} ta API chaqiruv`);
  console.log(`   ${signals.mutationPaths.size} ta mutation/button yo'li`);
  console.log(`   ${signals.pageRoutes.size} ta sahifa route`);
  console.log(`   ${signals.navLinks.size} ta nav link`);
  console.log(`   ${signals.tabValues.size} ta tab qiymati`);

  console.log('📄 Sahifa statsistikasi...');
  const pageStats = extractPageStats();
  console.log(`   ${pageStats.length} ta sahifa`);

  console.log('🔄 Frontend API chaqiruvlari skanerlanmoqda...');
  const frontendCalls = extractFrontendApiCalls();
  console.log(`   ${frontendCalls.length} ta API chaqiruv yozuvi`);

  console.log('⚙️  Tahlil qilinmoqda...');

  // ── Backend coverage analysis ──────────────────────────────────────────────
  const coverage = backendRoutes.map(r => analyzeCoverage(r, signals));

  const fullCovered    = coverage.filter(c => c.level === 'FULL');
  const partialCovered = coverage.filter(c => c.level === 'PARTIAL');
  const notCovered     = coverage.filter(c => c.level === 'NONE');

  // Mutating routes with no button
  const mutatingUncovered = coverage.filter(c =>
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.route.method) &&
    !c.byApiCall && !c.byButton
  );

  // GET routes with no coverage at all
  const getUncovered = notCovered.filter(c => c.route.method === 'GET');

  // ── Frontend → Backend: 404 risk ──────────────────────────────────────────
  const highConf = frontendCalls.filter(c => c.confidence === 'high');
  const missing404: FrontendApiCall[] = [];
  const matched404: FrontendApiCall[] = [];

  for (const call of highConf) {
    const hasMatch = backendRoutes.some(r => urlMatches(call.normalized, r.normalized));
    (hasMatch ? matched404 : missing404).push(call);
  }

  // Deduplicate 404 missing
  const seen = new Set<string>();
  const uniqueMissing404: FrontendApiCall[] = [];
  for (const m of missing404) {
    if (!seen.has(m.normalized)) { seen.add(m.normalized); uniqueMissing404.push(m); }
  }

  // ── Page health ───────────────────────────────────────────────────────────
  const pagesNoButton      = pageStats.filter(p => !p.hasButton && !p.hasOnClick && !p.hasOnSubmit);
  const pagesNoApiCall     = pageStats.filter(p => !p.hasApiCall);
  const pagesButtonNoApi   = pageStats.filter(p => (p.hasButton || p.hasOnClick) && !p.hasApiCall);

  // ── Group uncovered backend by module ──────────────────────────────────────
  const noneByModule = new Map<string, BackendCoverage[]>();
  for (const c of notCovered) {
    const mod = c.route.module;
    if (!noneByModule.has(mod)) noneByModule.set(mod, []);
    noneByModule.get(mod)!.push(c);
  }

  const mutatingByModule = new Map<string, BackendCoverage[]>();
  for (const c of mutatingUncovered) {
    const mod = c.route.module;
    if (!mutatingByModule.has(mod)) mutatingByModule.set(mod, []);
    mutatingByModule.get(mod)!.push(c);
  }

  const missing404ByModule = new Map<string, FrontendApiCall[]>();
  for (const m of uniqueMissing404) {
    const seg = m.normalized.split('/').filter(Boolean)[1] ?? 'other';
    if (!missing404ByModule.has(seg)) missing404ByModule.set(seg, []);
    missing404ByModule.get(seg)!.push(m);
  }

  // ─── BUILD REPORT ──────────────────────────────────────────────────────────

  const W = 80;
  const L: string[] = [];

  const hr  = (c = '─') => L.push(c.repeat(W));
  const dhr = (c = '═') => L.push(c.repeat(W));
  const ln  = (s = '') => L.push(s);

  dhr();
  ln('TO\'LIQ TIZIM TEKSHIRUVI HISOBOTI  (Full System Audit)');
  ln(`Sana: ${new Date().toISOString()}`);
  dhr();
  ln();

  // ─── §0: UMUMIY XULOSA ──────────────────────────────────────────────────
  ln('§0  UMUMIY XULOSA');
  hr();
  const pct = (n: number, d: number) => d ? ((n / d) * 100).toFixed(1) + '%' : '100%';

  ln();
  ln('  ┌─ BACKEND QAMROVI ──────────────────────────────────────────────────┐');
  ln(`  │  Jami backend routlar               : ${String(backendRoutes.length).padStart(5)}                       │`);
  ln(`  │  To'liq qamrab olingan (API/button)  : ${String(fullCovered.length).padStart(5)}  (${pct(fullCovered.length, backendRoutes.length).padStart(6)})          │`);
  ln(`  │  Qisman qamrab olingan (sahifa/nav)  : ${String(partialCovered.length).padStart(5)}  (${pct(partialCovered.length, backendRoutes.length).padStart(6)})          │`);
  ln(`  │  Umuman qamlanmagan                  : ${String(notCovered.length).padStart(5)}  (${pct(notCovered.length, backendRoutes.length).padStart(6)})  ← ASOSIY │`);
  ln(`  │    - GET routlar qamlanmagan         : ${String(getUncovered.length).padStart(5)}                       │`);
  ln(`  │    - Mutatsiya (POST/PUT/...) yo'q   : ${String(mutatingUncovered.length).padStart(5)}                       │`);
  ln('  └────────────────────────────────────────────────────────────────────┘');
  ln();
  ln('  ┌─ FRONTEND → BACKEND (404 XAVFI) ──────────────────────────────────┐');
  ln(`  │  Yuqori ishonchdagi API chaqiruvlar  : ${String(highConf.length).padStart(5)}                       │`);
  ln(`  │  Backendda mos keladiganlar          : ${String(matched404.length).padStart(5)}                       │`);
  ln(`  │  Backendda YO'Q (404 xavfi)          : ${String(uniqueMissing404.length).padStart(5)}  ← TUZATISH KERAK  │`);
  ln('  └────────────────────────────────────────────────────────────────────┘');
  ln();
  ln('  ┌─ SAHIFA SOGLIGI ───────────────────────────────────────────────────┐');
  ln(`  │  Jami sahifalar                      : ${String(pageStats.length).padStart(5)}                       │`);
  ln(`  │  Buttonsiz sahifalar                 : ${String(pagesNoButton.length).padStart(5)}                       │`);
  ln(`  │  API chaqiruvsiz sahifalar           : ${String(pagesNoApiCall.length).padStart(5)}                       │`);
  ln(`  │  Button bor, API yo'q (uzilgan?)     : ${String(pagesButtonNoApi.length).padStart(5)}  ← TEKSHIRISH KERAK│`);
  ln('  └────────────────────────────────────────────────────────────────────┘');
  ln();

  // ─── §1: UMUMAN QAMLANMAGAN BACKEND ROUTLAR ─────────────────────────────
  hr();
  ln(`§1  UMUMAN QAMLANMAGAN BACKEND ROUTLAR  (${notCovered.length} ta)`);
  ln('    Na API chaqiruv, na sahifa, na nav link, na tab, na button topilmadi');
  hr();
  ln();

  if (notCovered.length === 0) {
    ln('  ✅ Barcha backend routlar qandaydir usulda frontendda mavjud!');
  } else {
    for (const [mod, group] of [...noneByModule.entries()].sort()) {
      const label = mod.toUpperCase();
      ln(`  ┌── ${label} (${group.length} ta) ${'─'.repeat(Math.max(0, W - 10 - label.length))}`);
      for (const { route } of group) {
        ln(`  │  ${route.method.padEnd(7)} ${route.path}`);
        ln(`  │  Fayl : ${route.file}`);
        ln(`  │`);
      }
      ln();
    }
  }

  // ─── §2: MUTATSIYA ROUTLAR — FRONTEND BUTTON YO'Q ───────────────────────
  hr();
  ln(`§2  MUTATSIYA ROUTLAR — FRONTEND DA BUTTON / API CHAQIRUV YO'Q  (${mutatingUncovered.length} ta)`);
  ln('    POST / PUT / PATCH / DELETE routlar — frontendda bevosita chaqirilmayapti');
  hr();
  ln();

  if (mutatingUncovered.length === 0) {
    ln('  ✅ Barcha mutatsiya routlari frontendda bog\'langan!');
  } else {
    for (const [mod, group] of [...mutatingByModule.entries()].sort()) {
      const label = mod.toUpperCase();
      ln(`  ┌── ${label} (${group.length} ta) ${'─'.repeat(Math.max(0, W - 10 - label.length))}`);
      for (const { route } of group) {
        ln(`  │  ${route.method.padEnd(7)} ${route.path}`);
        ln(`  │  Fayl : ${route.file}`);
        ln(`  │`);
      }
      ln();
    }
  }

  // ─── §3: FRONTEND → BACKEND 404 XAVFI ───────────────────────────────────
  hr();
  ln(`§3  FRONTEND → BACKEND: 404 XAVFI  (${uniqueMissing404.length} ta)`);
  ln('    Frontend chaqirayapti, lekin backend routda bunday yo\'l yo\'q');
  hr();
  ln();

  if (uniqueMissing404.length === 0) {
    ln('  ✅ Barcha frontend API chaqiruvlari backendda topildi!');
  } else {
    for (const [mod, group] of [...missing404ByModule.entries()].sort()) {
      ln(`  [${mod.toUpperCase()}] — ${group.length} ta:`);
      for (const call of group) {
        ln(`    ✗ ${call.url}`);
        ln(`      ${call.file}:${call.line}`);
      }
      ln();
    }
  }

  // ─── §4: QISMAN QAMRANGAN ROUTLAR ───────────────────────────────────────
  hr();
  ln(`§4  QISMAN QAMRANGAN ROUTLAR  (${partialCovered.length} ta)`);
  ln('    Sahifa/nav/tab orqali mavjud, lekin bevosita API chaqiruv yo\'q');
  hr();
  ln();

  if (partialCovered.length === 0) {
    ln('  ✅ Barcha qamrangan routlar to\'liq bevosita API chaqiruvga ega!');
  } else {
    const partialByMod = new Map<string, BackendCoverage[]>();
    for (const c of partialCovered) {
      if (!partialByMod.has(c.route.module)) partialByMod.set(c.route.module, []);
      partialByMod.get(c.route.module)!.push(c);
    }
    for (const [mod, group] of [...partialByMod.entries()].sort()) {
      ln(`  [${mod.toUpperCase()}] — ${group.length} ta:`);
      for (const c of group.slice(0, 8)) {
        const via = c.byPageRoute ? `sahifa: ${c.byPageRoute}` : c.byNavLink ? `nav: ${c.byNavLink}` : c.byTabValue ? `tab: ${c.byTabValue}` : '';
        ln(`    ~ ${c.route.method.padEnd(7)} ${c.route.path}`);
        ln(`      ← ${via}`);
      }
      if (group.length > 8) ln(`    ... va yana ${group.length - 8} ta`);
      ln();
    }
  }

  // ─── §5: BUTTON BOR, API YO'Q SAHIFALAR ─────────────────────────────────
  hr();
  ln(`§5  BUTTON BOR LEKIN API CHAQIRUV YO'Q SAHIFALAR  (${pagesButtonNoApi.length} ta)`);
  ln('    Bu sahifalardagi buttonlar backendga ulanmagan bo\'lishi mumkin');
  hr();
  ln();

  if (pagesButtonNoApi.length === 0) {
    ln('  ✅ Barcha interaktiv sahifalar API ga ulangan!');
  } else {
    for (const p of pagesButtonNoApi) {
      ln(`  ✗ ${p.name}  (onClick:${p.onClickCount} onSubmit:${p.onSubmitCount})`);
    }
  }
  ln();

  // ─── §6: TO'LIQ QAMRANGAN ROUTLAR STATISTIKASI ──────────────────────────
  hr();
  ln(`§6  TO'LIQ QAMRANGAN ROUTLAR  (${fullCovered.length} ta) — barcha signal manbalari`);
  hr();
  ln();

  const fullByMod = new Map<string, BackendCoverage[]>();
  for (const c of fullCovered) {
    if (!fullByMod.has(c.route.module)) fullByMod.set(c.route.module, []);
    fullByMod.get(c.route.module)!.push(c);
  }

  const allModules = new Set([...backendRoutes.map(r => r.module)]);
  for (const mod of [...allModules].sort()) {
    const modRoutes = backendRoutes.filter(r => r.module === mod);
    const modFull   = fullCovered.filter(c => c.route.module === mod);
    const modPart   = partialCovered.filter(c => c.route.module === mod);
    const modNone   = notCovered.filter(c => c.route.module === mod);
    const pctMod    = pct(modFull.length + modPart.length, modRoutes.length);
    ln(`  ${mod.toUpperCase().padEnd(20)} ${modRoutes.length} route | ✓ ${modFull.length} to'liq | ~ ${modPart.length} qisman | ✗ ${modNone.length} yo'q | ${pctMod}`);
  }
  ln();

  // ─── §7: SAHIFA SOGLIGI TO'LIQ ──────────────────────────────────────────
  hr();
  ln(`§7  BARCHA SAHIFALAR SOGLIGI  (${pageStats.length} ta sahifa)`);
  hr();
  ln();

  const hdr = `${'Sahifa'.padEnd(52)} ${'onClick'.padStart(8)} ${'submit'.padStart(7)} ${'mutation'.padStart(9)} ${'apiCall'.padStart(8)} ${'API?'.padStart(5)}`;
  ln(`  ${hdr}`);
  ln(`  ${'─'.repeat(52)} ${'─'.repeat(8)} ${'─'.repeat(7)} ${'─'.repeat(9)} ${'─'.repeat(8)} ${'─'.repeat(5)}`);

  for (const p of pageStats) {
    const name = p.name.length > 50 ? '...' + p.name.slice(-47) : p.name;
    const hasApi = p.hasApiCall ? '✓' : '✗';
    ln(
      `  ${name.padEnd(52)}` +
      ` ${String(p.onClickCount).padStart(8)}` +
      ` ${String(p.onSubmitCount).padStart(7)}` +
      ` ${String(p.mutationCount).padStart(9)}` +
      ` ${String(p.apiCalls.length).padStart(8)}` +
      ` ${hasApi.padStart(5)}`
    );
  }
  ln();

  dhr();
  ln(`Hisobot yakunlandi: ${new Date().toISOString()}`);
  ln(`Fayl: ${REPORT_FILE}`);
  dhr();

  const report = L.join('\n');
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');

  // ── CONSOLE XULOSA ──────────────────────────────────────────────────────────
  console.log('');
  console.log('═'.repeat(70));
  console.log('NATIJA:');
  console.log(`  Backend routlar     : ${backendRoutes.length} ta`);
  console.log(`  To'liq qamrangan    : ${fullCovered.length} ta  (${pct(fullCovered.length, backendRoutes.length)})`);
  console.log(`  Qisman qamrangan    : ${partialCovered.length} ta  (${pct(partialCovered.length, backendRoutes.length)})`);
  console.log(`  Umuman yo'q  ⚠️     : ${notCovered.length} ta  (${pct(notCovered.length, backendRoutes.length)})`);
  console.log('');
  console.log(`  Mutatsiya button yo'q : ${mutatingUncovered.length} ta`);
  console.log(`  404 xavfi (frontend)  : ${uniqueMissing404.length} ta`);
  console.log(`  Button bor, API yo'q  : ${pagesButtonNoApi.length} ta sahifa`);
  console.log('═'.repeat(70));
  console.log('');
  console.log(`📄 To'liq hisobot: ${REPORT_FILE}`);
}

main();
