#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PAGES_DIR    = path.resolve(__dirname, '../artifacts/erp-dashboard/src/pages');
const API_LIB_DIR  = path.resolve(__dirname, '../artifacts/erp-dashboard/src/lib/api');
const MODULES_DIR  = path.resolve(__dirname, '../apps/api/src/modules');
const REPORT_FILE  = path.resolve(__dirname, 'button-audit-report.txt');

// ─── Helpers ────────────────────────────────────────────────────────────────

function walkFiles(dir, ext, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, ext, results);
    else if (entry.isFile() && entry.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function rel(p) {
  return path.relative(process.cwd(), p);
}

/**
 * Normalize a route path so that Nest-style params (:id, :name, etc.) and
 * frontend template-literal segments (${id}, ${someVar}, etc.) are both
 * replaced with the same placeholder, enabling matching.
 *   /api/hr/employees/:employeeId  →  /api/hr/employees/*
 *   /api/hr/employees/${id}        →  /api/hr/employees/*
 */
function normalizePath(p) {
  return p
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '*')   // :param
    .replace(/\$\{[^}]+\}/g, '*')                // ${expr}
    .replace(/\*+/g, '*')                         // collapse consecutive *
    .replace(/\/+$/, '');                         // trim trailing slash
}

// ─── 1. Scan frontend pages ──────────────────────────────────────────────────

const pageFiles = walkFiles(PAGES_DIR, '.tsx');

const pageStats = [];
const noButtonPages = [];

for (const file of pageFiles) {
  const src = fs.readFileSync(file, 'utf8');

  const hasButton     = /<Button[\s>/]/.test(src);
  const hasOnClick    = /\bonClick\b/.test(src);
  const hasOnSubmit   = /\bonSubmit\b/.test(src);
  const hasMutation   = /\buseMutation\b/.test(src);
  const hasApiRequest = /\bapiRequest\b/.test(src);

  const onClickCount  = (src.match(/\bonClick\b/g) || []).length;
  const onSubmitCount = (src.match(/\bonSubmit\b/g) || []).length;
  const mutationCount = (src.match(/\buseMutation\b/g) || []).length;

  // Extract apiRequest calls with literal paths
  const apiCallRegex  = /apiRequest\(\s*["'`]([A-Z]+)["'`]\s*,\s*`([^`]+)`|apiRequest\(\s*["'`]([A-Z]+)["'`]\s*,\s*["']([^"']+)["']/g;
  const apiCalls = [];
  let m;
  while ((m = apiCallRegex.exec(src)) !== null) {
    const method = m[1] || m[3];
    const rawPath = m[2] || m[4];
    if (method && rawPath) {
      apiCalls.push({ method, path: rawPath, normalized: normalizePath(rawPath) });
    }
  }

  const stat = {
    file,
    name: path.relative(PAGES_DIR, file),
    hasButton,
    hasOnClick,
    hasOnSubmit,
    hasMutation,
    hasApiRequest,
    onClickCount,
    onSubmitCount,
    mutationCount,
    apiCallCount: apiCalls.length,
    apiCalls,
  };

  pageStats.push(stat);

  if (!hasButton && !hasOnClick) {
    noButtonPages.push(stat);
  }
}

// ─── 2. Scan backend controllers for mutating endpoints ──────────────────────

const controllerFiles = walkFiles(MODULES_DIR, '.controller.ts');

const backendEndpoints = [];

for (const file of controllerFiles) {
  const src = fs.readFileSync(file, 'utf8');

  // Extract controller base path
  const ctrlMatch = src.match(/@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/);
  const rawBase   = ctrlMatch ? ctrlMatch[1] : '';
  // Normalize base: strip leading/trailing slashes; strip a leading "api/" prefix
  // so we never double-prepend /api
  const baseNorm  = rawBase.replace(/^\/+|\/+$/g, '').replace(/^api\//, '');
  const basePath  = baseNorm;  // may be empty

  const decoratorRegex = /@(Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;
  let dm;
  while ((dm = decoratorRegex.exec(src)) !== null) {
    const method = dm[1].toUpperCase();
    const sub    = (dm[2] || '').replace(/^\/+|\/+$/g, '');
    const segments = ['api', basePath, sub].filter(Boolean);
    const fullPath = '/' + segments.join('/');
    backendEndpoints.push({
      method,
      fullPath,
      normalized: normalizePath(fullPath),
      file,
    });
  }
}

// ─── 2b. Scan API client lib (src/lib/api/*.ts) for apiRequest calls ─────────

const apiLibFiles = walkFiles(API_LIB_DIR, '.ts');
const apiLibCalls = [];

for (const file of apiLibFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const apiCallRegex = /apiRequest\(\s*["'`]([A-Z]+)["'`]\s*,\s*`([^`]+)`|apiRequest\(\s*["'`]([A-Z]+)["'`]\s*,\s*["']([^"']+)["']/g;
  let m;
  while ((m = apiCallRegex.exec(src)) !== null) {
    const method  = m[1] || m[3];
    const rawPath = m[2] || m[4];
    if (method && rawPath) {
      apiLibCalls.push({ method, path: rawPath, normalized: normalizePath(rawPath) });
    }
  }
}

// ─── 3. Match backend endpoints against frontend API calls ───────────────────

// Collect all normalized mutating frontend API paths (pages + api lib)
const frontendCallKeys = new Set();
for (const p of pageStats) {
  for (const c of p.apiCalls) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.method)) {
      frontendCallKeys.add(`${c.method}:${c.normalized}`);
    }
  }
}
for (const c of apiLibCalls) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.method)) {
    frontendCallKeys.add(`${c.method}:${c.normalized}`);
  }
}

const unmatchedEndpoints = [];
const matchedEndpoints   = [];

for (const ep of backendEndpoints) {
  const key = `${ep.method}:${ep.normalized}`;
  if (frontendCallKeys.has(key)) {
    matchedEndpoints.push(ep);
  } else {
    unmatchedEndpoints.push(ep);
  }
}

// ─── 4. Active pages ─────────────────────────────────────────────────────────

const activePages = pageStats.filter(p => p.hasButton || p.hasOnClick || p.hasOnSubmit);

// ─── 5. Format report ────────────────────────────────────────────────────────

const lines = [];
function line(s = '') { lines.push(s); }

const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

line('╔══════════════════════════════════════════════════════════════════════╗');
line('║           EUROPRINT ERP — TUGMALAR TO\'LIQ AUDIT HISOBOTI            ║');
line(`║  ${now.padEnd(68)}║`);
line('╚══════════════════════════════════════════════════════════════════════╝');
line();

// ── §1: Pages without buttons ─────────────────────────────────────────────────
line('══════════════════════════════════════════════════════════════════════');
line(`§1 — SAHIFADA TUGMA YO'Q  (<Button>, onClick, onSubmit topilmagan)`);
line('══════════════════════════════════════════════════════════════════════');
if (noButtonPages.length === 0) {
  line('  ✔  Barcha sahifalarda tugma yoki hodisa topildi.');
} else {
  line(`  Jami: ${noButtonPages.length} ta sahifa`);
  line();
  for (const p of noButtonPages) {
    line(`  ✘  ${p.name}`);
  }
}
line();

// ── §2: Backend endpoints without frontend button ─────────────────────────────
line('══════════════════════════════════════════════════════════════════════');
line('§2 — BACKEND BOR, FRONTEND TUGMA YO\'Q');
line('  (POST/PUT/PATCH/DELETE — frontend da mos apiRequest topilmagan)');
line('  (Marshrutlar normallanib taqqoslandi: :id va ${id} → *)');
line('══════════════════════════════════════════════════════════════════════');
if (unmatchedEndpoints.length === 0) {
  line('  ✔  Barcha mutatsiya endpointlari frontendda bog\'langan.');
} else {
  line(`  Jami: ${unmatchedEndpoints.length} ta endpoint`);
  line();
  const byFile = {};
  for (const ep of unmatchedEndpoints) {
    const k = rel(ep.file);
    if (!byFile[k]) byFile[k] = [];
    byFile[k].push(ep);
  }
  for (const [f, eps] of Object.entries(byFile)) {
    line(`  ${f}`);
    for (const ep of eps) {
      line(`    ⚠  ${ep.method.padEnd(7)}  ${ep.fullPath}`);
    }
  }
}
line();

// ── §3: Active pages with button stats ────────────────────────────────────────
line('══════════════════════════════════════════════════════════════════════');
line('§3 — TUGMALAR MAVJUD VA ISHLAYDI');
line('══════════════════════════════════════════════════════════════════════');
const hdr = `${'Sahifa'.padEnd(56)} ${'onClick'.padStart(8)} ${'onSubmit'.padStart(10)} ${'mutation'.padStart(10)} ${'apiCall'.padStart(9)}`;
line(`  ${hdr}`);
line(`  ${'-'.repeat(56)} ${'-'.repeat(8)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(9)}`);
for (const p of activePages) {
  const name = p.name.length > 54 ? '...' + p.name.slice(-51) : p.name;
  line(
    `  ${name.padEnd(56)}` +
    ` ${String(p.onClickCount).padStart(8)}` +
    ` ${String(p.onSubmitCount).padStart(10)}` +
    ` ${String(p.mutationCount).padStart(10)}` +
    ` ${String(p.apiCallCount).padStart(9)}`
  );
}
line();

// ── §4: Summary ───────────────────────────────────────────────────────────────
line('══════════════════════════════════════════════════════════════════════');
line('§4 — UMUMIY STATISTIKA');
line('══════════════════════════════════════════════════════════════════════');

const totalPages      = pageStats.length;
const noButtonCount   = noButtonPages.length;
const activeCount     = activePages.length;
const totalOnClick    = pageStats.reduce((s, p) => s + p.onClickCount, 0);
const totalOnSubmit   = pageStats.reduce((s, p) => s + p.onSubmitCount, 0);
const totalMutations  = pageStats.reduce((s, p) => s + p.mutationCount, 0);
const totalApiCalls   = pageStats.reduce((s, p) => s + p.apiCallCount, 0);
const totalBackend    = backendEndpoints.length;
const matchedCount    = matchedEndpoints.length;
const unmatchedCount  = unmatchedEndpoints.length;

const pad = (label, val) => line(`  ${label.padEnd(55)} ${String(val).padStart(7)}`);

pad('Jami sahifalar (tsx fayllar):', totalPages);
pad("Tugmasiz sahifalar (onClick/onSubmit ham yo'q):", noButtonCount);
pad('Interaktiv sahifalar (tugma/hodisa mavjud):', activeCount);
pad('Jami onClick hodisalari:', totalOnClick);
pad('Jami onSubmit hodisalari:', totalOnSubmit);
pad('Jami useMutation ishlatilishlari:', totalMutations);
pad('Jami apiRequest chaqiruvlari (frontend):', totalApiCalls);
line();
pad('Backend mutatsiya endpointlari (POST/PUT/PATCH/DELETE):', totalBackend);
pad("Frontend da bog'langan endpointlar (normallanib):", matchedCount);
pad("Frontend da bog'lanmagan endpointlar:", unmatchedCount);
line();

const coverage = totalBackend > 0
  ? ((matchedCount / totalBackend) * 100).toFixed(1)
  : '100.0';
line(`  Statik qamrov darajasi: ${coverage}%`);
line(`  (Eslatma: dinamik yo'llar (useMutation + computed URL) hisobga olinmagan)`);
line();
line(`  Yakunlandi: ${now}`);
line('══════════════════════════════════════════════════════════════════════');

// ─── Output ───────────────────────────────────────────────────────────────────

const report = lines.join('\n');

console.log(report);

fs.writeFileSync(REPORT_FILE, report, 'utf8');
console.log(`\n  → Hisobot saqlandi: ${rel(REPORT_FILE)}`);
