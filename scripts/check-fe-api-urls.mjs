#!/usr/bin/env node
/**
 * check-fe-api-urls.mjs
 * FE da ishlatiladigan API URL'larni BE endpoint'lari bilan solishtiradi.
 * WARNING only — commit block qilmaydi.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// FE API URLs yig'ish
const FE_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src');
const BE_DIR = path.join(ROOT, 'apps/api/src');

const FE_URL_RE = /apiRequest\s*\(\s*["'][A-Z]+["']\s*,\s*["'`](\/?api\/[^"'`\s?#]+)/g;
const BE_ROUTE_RE = /@(?:Get|Post|Patch|Put|Delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;

function extractFromDir(dir, re) {
  const results = new Set();
  try {
    const files = execSync(`find "${dir}" -name "*.ts" -o -name "*.tsx" 2>/dev/null`, { encoding: 'utf8' })
      .split('\n').filter(Boolean);
    for (const f of files) {
      try {
        const content = readFileSync(f, 'utf8');
        let m;
        while ((m = re.exec(content)) !== null) results.add(m[1]);
      } catch {}
    }
  } catch {}
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

if (mismatches.length > 0) {
  console.warn(`\n⚠️  ${mismatches.length} ta FE URL backend'da topilmadi:`);
  for (const u of mismatches.slice(0, 10)) console.warn(`   ${u}`);
  if (mismatches.length > 10) console.warn(`   ... va ${mismatches.length - 10} ta boshqa`);
  console.warn('💡 Tekshiring: BE endpoint mavjudmi?\n');
}

process.exit(0); // WARNING only
