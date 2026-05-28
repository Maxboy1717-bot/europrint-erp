#!/usr/bin/env node
/**
 * check-fe-api-urls.mjs
 * FE da ishlatiladigan API URL'larni BE endpoint'lari bilan solishtiradi.
 * WARNING only — commit block qilmaydi.
 *
 * Cross-platform: fayllarni native Node `fs` bilan rekursiv aylanadi.
 * (Avval `execSync('find ...')` ishlatilardi — Windows cmd.exe da `find`
 * boshqa buyruq bo'lgani uchun jimgina fail bo'lardi → checker hech narsa
 * solishtirmasdan o'tib ketardi.)
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// FE API URLs yig'ish
const FE_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src');
const BE_DIR = path.join(ROOT, 'apps/api/src');

const FE_URL_RE = /apiRequest\s*\(\s*["'][A-Z]+["']\s*,\s*["'`](\/?api\/[^"'`\s?#]+)/g;
const BE_ROUTE_RE = /@(?:Get|Post|Patch|Put|Delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;

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

function extractFromDir(dir, re) {
  const results = new Set();
  for (const f of walk(dir)) {
    let content;
    try {
      content = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) results.add(m[1]);
  }
  return results;
}

const feUrls = extractFromDir(FE_DIR, FE_URL_RE);
const beRoutes = extractFromDir(BE_DIR, BE_ROUTE_RE);

// BE route'larni normalize (prefix'lar bilan)
const beNormalized = new Set();
for (const r of beRoutes) {
  beNormalized.add(r.replace(/^\//, '').toLowerCase());
  beNormalized.add('api/' + r.replace(/^\//, '').toLowerCase());
}

const mismatches = [];
for (const url of feUrls) {
  const normalized = url.replace(/^\//, '').toLowerCase().replace(/\$\{[^}]+\}/g, ':id');
  const found = [...beNormalized].some(r => normalized.includes(r) || r.includes(normalized.replace(/\/:[^/]+/g, '')));
  if (!found) mismatches.push(url);
}

if (feUrls.size === 0 || beRoutes.size === 0) {
  console.warn(`\n⚠️  check-fe-api-urls: skanlash bo'sh natija qaytardi (FE=${feUrls.size}, BE=${beRoutes.size}). Yo'llarni tekshiring.\n`);
} else if (mismatches.length > 0) {
  console.warn(`\n⚠️  ${mismatches.length} ta FE URL backend'da topilmadi:`);
  for (const u of mismatches.slice(0, 10)) console.warn(`   ${u}`);
  if (mismatches.length > 10) console.warn(`   ... va ${mismatches.length - 10} ta boshqa`);
  console.warn('💡 Tekshiring: BE endpoint mavjudmi?\n');
}

process.exit(0); // WARNING only
