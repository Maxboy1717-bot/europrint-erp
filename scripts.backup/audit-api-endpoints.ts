/**
 * API 404 Audit Script
 * Scans frontend (erp-dashboard) for /api/* calls and compares with
 * registered NestJS backend routes to find potential 404s.
 *
 * Usage: pnpm tsx scripts/audit-api-endpoints.ts
 * Output: scripts/api-404-audit-report.txt
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const FRONTEND_DIR  = path.resolve('artifacts/erp-dashboard/src');
const BACKEND_DIR   = path.resolve('apps/api/src/modules');
const GLOBAL_PREFIX = 'api';
const REPORT_FILE   = path.resolve('scripts/api-404-audit-report.txt');

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface FrontendCall {
  file: string;
  line: number;
  url: string;
  normalized: string;
  confidence: 'high' | 'low';
}

interface BackendRoute {
  file: string;
  method: string;
  path: string;
  normalized: string;
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
 * Normalize a URL for matching:
 * - Replace ${...} template expressions with *
 * - Replace :param segments with *
 * - Replace numeric IDs in path with *
 * - Remove query strings
 * - Lowercase, remove trailing slash
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/\$\{[^}]+\}/g, '*')           // ${expr} → *
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '*') // :param → *
    .replace(/\/\d+(?=\/|$)/g, '/*')         // /123 → /*
    .replace(/\?.*$/, '')                     // remove query string
    .replace(/\/+$/, '')                      // remove trailing slash
    .toLowerCase()
    .trim();
}

/**
 * Check if a frontend URL matches a backend route.
 * Uses wildcard matching where * in either side matches any segment.
 */
function urlMatches(frontNorm: string, backNorm: string): boolean {
  if (frontNorm === backNorm) return true;

  const frontParts = frontNorm.split('/').filter(Boolean);
  const backParts  = backNorm.split('/').filter(Boolean);

  if (frontParts.length !== backParts.length) return false;

  return frontParts.every((fp, i) => {
    const bp = backParts[i];
    return fp === bp || fp === '*' || bp === '*';
  });
}

// ─── STEP 1: EXTRACT FRONTEND API CALLS ──────────────────────────────────────

function extractFrontendCalls(): FrontendCall[] {
  const calls: FrontendCall[] = [];
  const files = walkDir(FRONTEND_DIR, ['.tsx', '.ts']);

  // Patterns that capture /api/... URLs
  const patterns: RegExp[] = [
    // fetch('/api/...')  fetch("/api/...")  fetch(`/api/...`)
    /fetch\s*\(\s*[`'"](\/api\/[^`'")\s]*)[`'"]/g,
    // queryKey: ['/api/...']  queryKey: ["/api/..."]  queryKey: [`/api/...`]
    /queryKey\s*:\s*\[\s*[`'"](\/api\/[^`'"\]]*)[`'"]/g,
    // url: '/api/...'  url: "/api/..."
    /\burl\s*:\s*[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    // '/api/...' or "/api/..." as standalone argument/value (not already caught)
    /(?:^|[^a-zA-Z0-9_$])[`'"](\/api\/[^`'")\s,]*)[`'"]/g,
    // template literal backtick paths: `/api/${...}/...`
    /`(\/api\/[^`]*)`/g,
  ];

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(line)) !== null) {
          const raw = match[1];
          if (!raw || !raw.startsWith('/api/')) continue;

          // Skip imports and comment lines
          const trimmed = line.trimStart();
          if (trimmed.startsWith('import ') || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

          const normalized = normalizeUrl(raw);

          // Detect low-confidence: URL contains unresolved ternary/conditional fragments
          // e.g. "/api/foo${condition ? '...' : '...'}" or ends with partial expression
          const isLowConfidence =
            /\$\{[^}]*\?/.test(raw) ||        // ternary inside template: ${x ? ...
            /\$\{[^}]*&&/.test(raw) ||         // logical-and inside template: ${x && ...
            raw.endsWith('${') ||              // truncated expression
            raw.includes('${queryString') ||   // common query string pattern
            raw.includes('${params') ||        // common params pattern
            raw.includes('${query') ||         // generic query variable
            /\$\{[a-zA-Z]+\s+\?/.test(raw);   // ternary: ${var ? ...

          const confidence: 'high' | 'low' = isLowConfidence ? 'low' : 'high';

          // Deduplicate: skip if same file+normalized already captured on this line
          const alreadyExists = calls.some(
            c => c.file === rel && c.line === lineIdx + 1 && c.normalized === normalized
          );
          if (!alreadyExists) {
            calls.push({ file: rel, line: lineIdx + 1, url: raw, normalized, confidence });
          }
        }
      }
    }
  }

  return calls;
}

// ─── STEP 2: EXTRACT BACKEND ROUTES ──────────────────────────────────────────

function extractBackendRoutes(): BackendRoute[] {
  const routes: BackendRoute[] = [];
  const files = walkDir(BACKEND_DIR, ['.controller.ts']);

  const httpMethods = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');

    // Extract controller base path(s)
    // @Controller('path') or @Controller({ path: 'path' })
    const controllerPaths: string[] = [];
    const ctrlRegex = /@Controller\s*\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`|\{\s*path\s*:\s*(?:'([^']*)'|"([^"]*)")\s*\})\s*\)/g;
    let cm: RegExpExecArray | null;
    while ((cm = ctrlRegex.exec(content)) !== null) {
      const p = cm[1] ?? cm[2] ?? cm[3] ?? cm[4] ?? cm[5] ?? '';
      controllerPaths.push(p);
    }
    // Handle @Controller() with no argument
    if (controllerPaths.length === 0 && content.includes('@Controller(')) {
      controllerPaths.push('');
    }

    const controllerBase = controllerPaths[0] ?? '';

    // Extract method-level routes
    for (const method of httpMethods) {
      // @Get('path'), @Post(), @Get(), @Get({ path: 'path' })
      const methodRegex = new RegExp(
        `@${method}\\s*\\(\\s*(?:'([^']*)'|"([^"]*)"|` + '`([^`]*)`' + `|\\{\\s*path\\s*:\\s*(?:'([^']*)'|"([^"]*)")\\s*\\})?\\s*\\)`,
        'g'
      );
      let mm: RegExpExecArray | null;
      while ((mm = methodRegex.exec(content)) !== null) {
        const methodPath = mm[1] ?? mm[2] ?? mm[3] ?? mm[4] ?? mm[5] ?? '';

        // Build full path
        const segments = [GLOBAL_PREFIX, controllerBase, methodPath]
          .map(s => s.replace(/^\/+|\/+$/g, ''))
          .filter(Boolean);
        const fullPath = '/' + segments.join('/');

        const normalized = normalizeUrl(fullPath);

        routes.push({
          file: rel,
          method: method.toUpperCase(),
          path: fullPath,
          normalized,
        });
      }
    }
  }

  return routes;
}

// ─── STEP 3: COMPARE AND REPORT ──────────────────────────────────────────────

function getModule(filePath: string): string {
  // Extract module name from file path
  // e.g. "artifacts/erp-dashboard/src/pages/director/Dashboard.tsx" → "director"
  //      "artifacts/erp-dashboard/src/pages/HrDashboard.tsx" → "hr" (by filename)
  //      "artifacts/erp-dashboard/src/hooks/chat/useRooms.ts" → "chat"

  const parts = filePath.replace(/\\/g, '/').split('/');
  const pagesIdx = parts.indexOf('pages');
  const hooksIdx = parts.indexOf('hooks');
  const libIdx   = parts.indexOf('lib');

  let contextIdx = pagesIdx !== -1 ? pagesIdx
    : hooksIdx !== -1 ? hooksIdx
    : libIdx   !== -1 ? libIdx
    : -1;

  if (contextIdx !== -1 && parts[contextIdx + 1]) {
    const next = parts[contextIdx + 1];
    // If next part is a folder (not a file), use it as module
    if (!next.includes('.')) return next.toLowerCase();
    // Otherwise derive from the URL
  }

  // Derive module from the URL path
  const url = filePath;
  const moduleKeywords = [
    'director', 'hr', 'finance', 'wms', 'production', 'crm', 'admin',
    'pos', 'lms', 'logistics', 'maintenance', 'procurement', 'barcode',
    'warehouse', 'cashflow', 'budget', 'payroll', 'attendance', 'recruitment',
    'ai', 'chat', 'reports', 'settings', 'security', 'iot', 'mes', 'mm', 'pp',
    'marketing', 'analytics', 'accountant', 'design', 'europrint-control',
    'audit', 'cfo', 'approval',
  ];
  for (const kw of moduleKeywords) {
    if (url.toLowerCase().includes(kw)) return kw;
  }
  return 'other';
}

function getModuleFromUrl(url: string): string {
  const seg = url.split('/').filter(Boolean);
  // seg[0] = 'api', seg[1] = module
  if (seg.length >= 2) return seg[1];
  return 'other';
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('🔍 Frontend API chaqiruvlari skanerlanmoqda...');
  const frontendCalls = extractFrontendCalls();
  console.log(`   ${frontendCalls.length} ta API chaqiruvi topildi`);

  console.log('📡 Backend routlari skanerlanmoqda...');
  const backendRoutes = extractBackendRoutes();
  console.log(`   ${backendRoutes.length} ta backend route topildi`);

  console.log('🔄 Moslik tekshirilmoqda...');

  // Split into high/low confidence
  const highConfidence = frontendCalls.filter(c => c.confidence === 'high');
  const lowConfidence  = frontendCalls.filter(c => c.confidence === 'low');

  // For each frontend call, check if any backend route matches
  const missing: FrontendCall[] = [];
  const matched: FrontendCall[] = [];

  for (const call of frontendCalls) {
    const hasMatch = backendRoutes.some(route => urlMatches(call.normalized, route.normalized));
    if (hasMatch) {
      matched.push(call);
    } else {
      missing.push(call);
    }
  }

  // Separate missing into high-confidence (actionable) vs low-confidence (noisy)
  const missingHigh = missing.filter(c => c.confidence === 'high');
  const missingLow  = missing.filter(c => c.confidence === 'low');

  // Deduplicate missing by normalized URL (keep first occurrence)
  const seenNorm = new Set<string>();
  const uniqueMissing: FrontendCall[] = [];
  for (const m of missingHigh) {
    if (!seenNorm.has(m.normalized)) {
      seenNorm.add(m.normalized);
      uniqueMissing.push(m);
    }
  }

  // Deduplicate low-confidence separately
  const seenLow = new Set<string>();
  const uniqueMissingLow: FrontendCall[] = [];
  for (const m of missingLow) {
    if (!seenLow.has(m.normalized)) {
      seenLow.add(m.normalized);
      uniqueMissingLow.push(m);
    }
  }

  // Group by module
  const byModule = new Map<string, FrontendCall[]>();
  for (const m of uniqueMissing) {
    const mod = getModuleFromUrl(m.url) || getModule(m.file);
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod)!.push(m);
  }

  // Sort modules alphabetically
  const sortedModules = [...byModule.keys()].sort();

  // ─── BUILD REPORT ────────────────────────────────────────────────────────

  const lines: string[] = [];
  lines.push('═'.repeat(80));
  lines.push('API 404 AUDIT REPORT');
  lines.push(`Sana: ${new Date().toISOString()}`);
  lines.push('═'.repeat(80));
  lines.push('');
  lines.push(`XULOSA:`);
  lines.push(`  Jami frontend API chaqiruvlari       : ${frontendCalls.length}`);
  lines.push(`    - Yuqori ishonch (aniq URL)         : ${highConfidence.length}`);
  lines.push(`    - Past ishonch (dinamik/shartli)    : ${lowConfidence.length}  ← SHOVQIN`);
  lines.push(`  Backend routlarda mos keladiganlar   : ${matched.length}`);
  lines.push(`  Mos kelmaganlar — yuqori ishonch      : ${uniqueMissing.length}  ← ASOSIY`);
  lines.push(`  Mos kelmaganlar — past ishonch (shovq): ${uniqueMissingLow.length}`);
  lines.push(`  Qamrab olingan modullar               : ${sortedModules.length}`);
  lines.push('');
  lines.push('─'.repeat(80));
  lines.push('MOS KELMAGANLAR (Modul bo\'yicha guruhlanган):');
  lines.push('─'.repeat(80));
  lines.push('');

  for (const mod of sortedModules) {
    const group = byModule.get(mod)!;
    lines.push(`┌── ${mod.toUpperCase()} (${group.length} ta) ${'─'.repeat(Math.max(0, 60 - mod.length))}`);
    for (const call of group) {
      lines.push(`│   URL  : ${call.url}`);
      lines.push(`│   Fayl : ${call.file}:${call.line}`);
      lines.push(`│`);
    }
    lines.push('');
  }

  // Low-confidence / noise section
  if (uniqueMissingLow.length > 0) {
    lines.push('─'.repeat(80));
    lines.push(`PAST ISHONCH (SHOVQIN) — Dinamik/shartli URL patternlar (${uniqueMissingLow.length} ta):`);
    lines.push('Bu URLlar ternary operator yoki boshqa conditional ifodalar tufayli');
    lines.push('to\'liq aniqlanmadi. Qo\'lda tekshirish tavsiya etiladi.');
    lines.push('─'.repeat(80));
    lines.push('');
    const lowByMod = new Map<string, FrontendCall[]>();
    for (const m of uniqueMissingLow) {
      const mod = getModuleFromUrl(m.url) || getModule(m.file);
      if (!lowByMod.has(mod)) lowByMod.set(mod, []);
      lowByMod.get(mod)!.push(m);
    }
    for (const [mod, group] of [...lowByMod.entries()].sort()) {
      lines.push(`  [${mod}] — ${group.length} ta`);
      for (const call of group.slice(0, 3)) {
        lines.push(`    URL : ${call.url}`);
        lines.push(`    Fayl: ${call.file}:${call.line}`);
      }
      if (group.length > 3) lines.push(`    ... va yana ${group.length - 3} ta`);
    }
    lines.push('');
  }

  lines.push('─'.repeat(80));
  lines.push('BACKEND ROUTLAR RO\'YXATI:');
  lines.push('─'.repeat(80));
  lines.push('');

  // Group backend routes by module
  const backendByModule = new Map<string, BackendRoute[]>();
  for (const r of backendRoutes) {
    const mod = r.path.split('/').filter(Boolean)[1] ?? 'other';
    if (!backendByModule.has(mod)) backendByModule.set(mod, []);
    backendByModule.get(mod)!.push(r);
  }
  for (const [mod, routes] of [...backendByModule.entries()].sort()) {
    lines.push(`  [${mod}]`);
    for (const r of routes) {
      lines.push(`    ${r.method.padEnd(7)} ${r.path}`);
    }
    lines.push('');
  }

  const report = lines.join('\n');
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');

  // ─── CONSOLE SUMMARY ─────────────────────────────────────────────────────

  console.log('');
  console.log('═'.repeat(60));
  console.log('XULOSA:');
  console.log(`  Jami frontend chaqiruvlar       : ${frontendCalls.length}`);
  console.log(`  Yuqori ishonchdagi topilmaganlar: ${uniqueMissing.length}`);
  console.log(`  Past ishonchdagi topilmaganlar   : ${uniqueMissingLow.length}`);
  console.log(`  Backend mos keladiganlar        : ${matched.length}`);
  console.log('═'.repeat(60));
  console.log('');

  if (uniqueMissing.length > 0) {
    console.log(`⚠️  ${uniqueMissing.length} ta frontend API chaqiruvi backendda topilmadi:`);
    console.log('');
    for (const mod of sortedModules) {
      const group = byModule.get(mod)!;
      console.log(`  [${mod.toUpperCase()}] — ${group.length} ta:`);
      for (const call of group.slice(0, 5)) {
        console.log(`    • ${call.url}`);
        console.log(`      ${call.file}:${call.line}`);
      }
      if (group.length > 5) {
        console.log(`    ... va yana ${group.length - 5} ta`);
      }
      console.log('');
    }
    console.log(`📄 To'liq hisobot: ${REPORT_FILE}`);
  } else {
    console.log('✅ Barcha frontend API chaqiruvlari backendda topildi!');
  }
}

main();
