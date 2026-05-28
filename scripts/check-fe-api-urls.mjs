#!/usr/bin/env node
/**
 * check-fe-api-urls.mjs — Guard: FE apiRequest() ↔ BE controller route shartnomasi
 * WARNING only — commit'ni bloklamaydi (exit 0).
 *
 * NEGA METOD+PREFIKS-AWARE (Session 17 qayta yozildi):
 *   Avvalgi versiya faqat URL stringini olardi va `includes` substring bilan
 *   solishtirardi — HTTP METODNI va `@Controller('prefix')` KOMPOZITSIYASINI
 *   e'tiborsiz qoldirardi. Natijada `/api/gl/accounts` bare `accounts` ga SOXTA
 *   mos kelardi, GET-only endpoint POST chaqiruvni "qondirardi" → haqiqiy drift
 *   tutilmasdi. Endi:
 *    - BE: har faylda `@Controller(prefix)` + `@Get/@Post/...(route)` ni
 *      kompozitsiya qilib `(METHOD, /api/prefix/route)` yasaydi. Metod dekoratori
 *      offset bo'yicha eng yaqin oldingi `@Controller`ga bog'lanadi → bitta faylda
 *      bir nechta controller bo'lsa ham to'g'ri.
 *    - FE: `apiRequest("METHOD", "/api/...")` dan (METHOD, URL) juftini oladi.
 *    - Solishtirish metodga sezgir + dinamik segment (`:id` / `${...}` → wildcard),
 *      check-sidebar-routes'dagi pathMatches bilan bir xil ruhda.
 *
 * Cross-platform: native Node `fs` rekursiv walk (Windows `find` jim no-op fix saqlangan).
 *
 * Usage:
 *   node scripts/check-fe-api-urls.mjs            # summary + birinchi 10 mismatch
 *   node scripts/check-fe-api-urls.mjs --verbose  # barcha mismatch
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const verbose = process.argv.includes('--verbose');

const FE_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src');
const BE_DIR = path.join(ROOT, 'apps/api/src');
const GLOBAL_PREFIX = 'api'; // NestJS app.setGlobalPrefix('api')

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.next']);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(path.join(dir, entry.name));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

/** Bir nechta bo'lakni bitta /-prefiksli yo'lga birlashtirish; bo'sh/dubl segment yo'qoladi. */
function joinApiPath(...parts) {
  const segs = parts.flatMap((p) => String(p).split('/')).filter(Boolean);
  // controller prefiksi allaqachon "api" bilan boshlansa — yetakchi dublni yig'ish
  while (segs.length > 1 && segs[0] === GLOBAL_PREFIX && segs[1] === GLOBAL_PREFIX) {
    segs.shift();
  }
  return '/' + segs.join('/');
}

/**
 * Izohlarni olib tashlash — aks holda izoh ichidagi `@Controller('x')` / `@Post('y')`
 * (masalan "soft-close NOTE" izohlari) skanerda fantom route/prefiks yasaydi va
 * offset-bog'lashda haqiqiy metodlarga noto'g'ri prefiks beradi.
 * `://` (URL) stringlarni saqlash uchun `//` dan oldin `:` bo'lmasligini talab qiladi.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '') // /* block */
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // // line (keeps "://" in strings)
}

/** ${...} (incl. `?.` optional chaining) → wildcard, query/hash olib tashlanadi, yetakchi `/`. */
function normalizePath(p) {
  let s = p.replace(/\$\{[^}]*\}/g, '*'); // template expr → wildcard (BEFORE query split)
  s = s.split('?')[0].split('#')[0];
  return s.startsWith('/') ? s : '/' + s;
}

/** Yo'lni solishtiriladigan segmentlarga ajratish; dinamik segment wildcard bo'ladi. */
function toSegs(p) {
  return normalizePath(p)
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (seg.startsWith(':')) return seg.endsWith('*') ? '**' : '*'; // :id / :rest*
      if (seg.includes('*')) return '*'; // ${...}-dan kelgan wildcard
      return seg.toLowerCase();
    });
}

/** Metodga + wildcard'ga sezgir segment-match (BE pattern vs FE url). */
function segMatch(be, fe) {
  for (let i = 0; i < be.length; i++) {
    if (be[i] === '**') return true; // splat qolganini yutadi
    if (i >= fe.length) return false;
    if (be[i] === '*' || fe[i] === '*') continue;
    if (be[i] !== fe[i]) return false;
  }
  return be.length === fe.length;
}

/** Dekorator argumentidan birinchi yo'l-stringini olish (`'x'` yoki `{ path: 'x' }`). */
function firstString(args) {
  const pathKey = args.match(/\bpath\s*:\s*['"`]([^'"`]*)['"`]/);
  if (pathKey) return pathKey[1];
  const lit = args.match(/['"`]([^'"`]*)['"`]/);
  return lit ? lit[1] : '';
}

// ---------------------------------------------------------------------------
// BE: @Controller(prefix) + @Get/@Post/...(route) → (METHOD, /api/prefix/route)
// ---------------------------------------------------------------------------
const CONTROLLER_RE = /@Controller\s*\(([^)]*)\)/g;
const METHOD_RE = /@(Get|Post|Patch|Put|Delete)\s*\(([^)]*)\)/g;

function collectBE() {
  const routes = [];
  for (const f of walk(BE_DIR)) {
    let src;
    try {
      src = stripComments(readFileSync(f, 'utf8'));
    } catch {
      continue;
    }
    const controllers = [];
    CONTROLLER_RE.lastIndex = 0;
    let cm;
    while ((cm = CONTROLLER_RE.exec(src)) !== null) {
      controllers.push({ index: cm.index, prefix: firstString(cm[1]) });
    }
    if (controllers.length === 0) continue; // controller yo'q → HTTP route yo'q
    METHOD_RE.lastIndex = 0;
    let mm;
    while ((mm = METHOD_RE.exec(src)) !== null) {
      const method = mm[1].toUpperCase();
      const route = firstString(mm[2]);
      // eng yaqin oldingi controller (offset bo'yicha)
      let prefix = controllers[0].prefix;
      for (const c of controllers) {
        if (c.index <= mm.index) prefix = c.prefix;
        else break;
      }
      const full = joinApiPath(GLOBAL_PREFIX, prefix, route);
      routes.push({ method, path: full, segs: toSegs(full) });
    }
  }
  return routes;
}

// ---------------------------------------------------------------------------
// FE: apiRequest("METHOD", "/api/...") → (METHOD, url)
// ---------------------------------------------------------------------------
// Keng capture: `${...}` blokini (ichida bo'sh joy/ternary bo'lsa ham) BUTUN oladi, aks holda
// bitta tirnoqsiz/bo'shliqsiz belgini; normalizePath keyin query'ni va template-expr'ni tozalaydi.
const FE_CALL_RE = /apiRequest\s*\(\s*["']([A-Z]+)["']\s*,\s*["'`](\/?api\/(?:\$\{[^}]*\}|[^"'`\s])+)/g;

function collectFE() {
  const calls = new Map(); // "METHOD canonical-url" bo'yicha dedupe
  for (const f of walk(FE_DIR)) {
    let src;
    try {
      src = stripComments(readFileSync(f, 'utf8'));
    } catch {
      continue;
    }
    FE_CALL_RE.lastIndex = 0;
    let m;
    while ((m = FE_CALL_RE.exec(src)) !== null) {
      const method = m[1].toUpperCase();
      const segs = toSegs(m[2]);
      const display = '/' + segs.join('/'); // wildcard-kanonik shakl (solishtirilgani bilan bir xil)
      const key = method + ' ' + display;
      if (!calls.has(key)) calls.set(key, { method, display, segs });
    }
  }
  return [...calls.values()];
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------
const beRoutes = collectBE();
const feCalls = collectFE();

const mismatches = [];
for (const fe of feCalls) {
  const found = beRoutes.some((be) => be.method === fe.method && segMatch(be.segs, fe.segs));
  if (!found) mismatches.push(`${fe.method} ${fe.display}`);
}
mismatches.sort();

if (feCalls.length === 0 || beRoutes.length === 0) {
  console.warn(
    `\n⚠️  check-fe-api-urls: skanlash bo'sh natija qaytardi (FE=${feCalls.length}, BE=${beRoutes.length}). Yo'llarni tekshiring.\n`,
  );
} else if (mismatches.length > 0) {
  const shown = verbose ? mismatches : mismatches.slice(0, 10);
  console.warn(`\n⚠️  ${mismatches.length} ta FE apiRequest BE route bilan mos kelmadi (metod+prefiks aware):`);
  for (const u of shown) console.warn(`   ${u}`);
  if (!verbose && mismatches.length > shown.length) {
    console.warn(`   ... va ${mismatches.length - shown.length} ta boshqa (--verbose to'liq ko'rsatadi)`);
  }
  console.warn(`💡 Tekshiring: BE'da shu METOD+URL endpoint bormi? [BE=${beRoutes.length} route, FE=${feCalls.length} call]\n`);
} else {
  console.log(`✅ check-fe-api-urls: barcha ${feCalls.length} FE apiRequest BE route'ga mos [BE=${beRoutes.length} route]`);
}

process.exit(0); // WARNING only
