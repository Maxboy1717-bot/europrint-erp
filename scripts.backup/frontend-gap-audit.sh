#!/bin/bash
# EuroPrint ERP — Frontend-Backend endpoint gap auditi
# Backend route'larni frontend apiRequest chaqiruvlari bilan solishtiradi
# Ishlatish: bash scripts/frontend-gap-audit.sh [--verbose]
set -euo pipefail

VERBOSE="${1:-}"
VERBOSE_ENV="$([ "$VERBOSE" = "--verbose" ] && echo "1" || echo "0")"
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
hdr() { echo -e "\n${BOLD}${BLUE}== $* ==${NC}"; }

echo "  EuroPrint ERP — Frontend-Backend Endpoint Gap Auditi"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  -------------------------------------------------------"

# Node.js — backend route extraction + frontend call extraction + comparison
VERBOSE="$VERBOSE_ENV" node - <<'NODE_SCRIPT'
const {execSync} = require('child_process');
const fs = require('fs');

// ── Backend route'larini ajratish ─────────────────────────────
const ctrlFiles = execSync('rg --files -g "*.controller.ts" apps/api/src')
  .toString().trim().split('\n').filter(Boolean);

const beRoutes = new Set();
for (const f of ctrlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const cm = content.match(/@Controller\(['"]([^'"]*)['"]/);
  let base = cm ? cm[1].replace(/^\//, '').replace(/\/$/, '') : '';
  // Remove 'api/' prefix if present (we add it manually)
  base = base.replace(/^api\//, '');

  for (const m of content.matchAll(/@(Post|Put|Patch|Delete|Get)\((?:['"]([^'"]*)['"]\s*)?\)/g)) {
    const method = m[1].toUpperCase();
    const sub = (m[2] || '').replace(/^\//, '').replace(/\/$/, '');
    // Build /api/base/sub (always include /api/ prefix)
    const segments = ['api', base, sub].filter(s => s !== '');
    let path = '/' + segments.join('/').replace(/\/+/g, '/');
    path = path.replace(/:[a-zA-Z_]\w*/g, '*').replace(/\/$/, '');
    beRoutes.add(method + ':' + path);
  }
}

// ── Frontend apiRequest chaqiruvlarini ajratish ───────────────
const feFiles = execSync(
  'rg --files -g "*.ts" -g "*.tsx" ' +
  'artifacts/erp-dashboard/src/lib/api ' +
  'artifacts/erp-dashboard/src/pages'
).toString().trim().split('\n').filter(Boolean);

const feCalls = new Set();
// Match: apiRequest("METHOD", "/api/path") or apiRequest("METHOD", `/api/${var}`)
const re = /apiRequest\(["']([A-Z]+)["'],\s*["'`]([^"'`]+)["'`]/g;
for (const f of feFiles) {
  const content = fs.readFileSync(f, 'utf8');
  for (const m of content.matchAll(re)) {
    let path = m[2].replace(/\${[^}]*}/g, '*').replace(/\/+/g, '/').replace(/\/$/, '');
    if (!path.startsWith('/')) path = '/' + path;
    feCalls.add(m[1] + ':' + path);
  }
}

// ── Statistika ────────────────────────────────────────────────
const beTotal = beRoutes.size;
const beMutRoutes = [...beRoutes].filter(r => !/^GET:/.test(r));
const beMut = beMutRoutes.length;
const feMutRoutes = [...feCalls].filter(r => !/^GET:/.test(r));
const feMut = feMutRoutes.length;

console.log('\n\x1b[1m\x1b[34m== §1. Backend route lari ==\x1b[0m');
console.log('  Jami route:          ' + String(beTotal).padStart(8));
console.log('  Mutatsiya:           ' + String(beMut).padStart(8));
console.log('  GET:                 ' + String(beTotal - beMut).padStart(8));

console.log('\n\x1b[1m\x1b[34m== §2. Frontend apiRequest chaqiruvlari ==\x1b[0m');
console.log('  Jami:                ' + String(feCalls.size).padStart(8));
console.log('  Mutatsiya:           ' + String(feMut).padStart(8));
console.log('  GET:                 ' + String(feCalls.size - feMut).padStart(8));

// ── Unlinked endpoint tahlili ─────────────────────────────────
console.log('\n\x1b[1m\x1b[34m== §3. Ulanmagan mutatsiya endpointlari ==\x1b[0m');
const unlinked = [];
for (const beRoute of beMutRoutes.sort()) {
  // BE wildcard (*) → regex; test against all FE calls
  const regexStr = '^' + beRoute.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+') + '$';
  let matched = false;
  try {
    const rx = new RegExp(regexStr);
    matched = feMutRoutes.some(fe => rx.test(fe));
  } catch { matched = feMutRoutes.includes(beRoute); }
  if (!matched) unlinked.push(beRoute);
}

const linked = beMut - unlinked.length;
const coverage = beMut > 0 ? (linked / beMut * 100).toFixed(1) : '0.0';

if (process.env.VERBOSE === '1' && unlinked.length > 0) {
  console.log('\n  Ulanmagan route lar (birinchi 30):');
  unlinked.slice(0, 30).forEach(r => console.log('    UNLINKED: ' + r));
}

console.log('');
console.log('  Backend mutatsiya endpointlari:   ' + String(beMut).padStart(5));
console.log('  Frontend da topilgan:             ' + String(linked).padStart(5));
console.log('  Ulanmagan endpointlar:            ' + String(unlinked.length).padStart(5));
console.log('  Qamrov darajasi:                  ' + String(coverage + '%').padStart(6));
console.log('');
console.log('  unlinked_endpoints=' + unlinked.length);

// ── Metod bo'yicha breakdown ──────────────────────────────────
console.log('\n\x1b[1m\x1b[34m== §4. Metod bo yicha gap ==\x1b[0m');
for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
  const b = [...beRoutes].filter(r => r.startsWith(method + ':')).length;
  const f = [...feCalls].filter(r => r.startsWith(method + ':')).length;
  console.log('  ' + (method + ':').padEnd(8) +
    ' BE:' + String(b).padStart(5) + '  FE:' + String(f).padStart(5) + '  Gap:' + String(b - f).padStart(5));
}

// ── Modul bo'yicha ────────────────────────────────────────────
console.log('\n\x1b[1m\x1b[34m== §5. Modul bo yicha (mutatsiya) ==\x1b[0m');
console.log('  ' + 'Modul'.padEnd(24) + 'POST  PUT PATCH  DEL JAMI');
console.log('  ' + '-'.repeat(55));

const mods = new Set(ctrlFiles.map(f => { const m = f.match(/modules\/([^/]+)\//); return m ? m[1] : null; }).filter(Boolean));
for (const mod of [...mods].sort()) {
  const modRts = beMutRoutes.filter(r => {
    const p = r.split(':')[1] || '';
    return p.includes('/' + mod + '/') || p.includes('/' + mod.replace(/-/g, '-')) || r.includes(mod);
  });
  const [mp, mu, mc, md] = ['POST', 'PUT', 'PATCH', 'DELETE'].map(x => modRts.filter(r => r.startsWith(x+':')).length);
  const mt = mp + mu + mc + md;
  if (mt > 0)
    console.log('  ' + mod.padEnd(24) + String(mp).padStart(4) + String(mu).padStart(5) + String(mc).padStart(6) + String(md).padStart(5) + String(mt).padStart(5));
}

console.log('\n  Yakunlandi: ' + new Date().toISOString().replace('T', ' ').substring(0, 19));
NODE_SCRIPT
