// One-shot: estimate "working" surface area —
//  - BE: real routes vs 501/stub routes
//  - FE: total pages vs placeholder/empty
//  - Sidebar wired routes
//  - Test pass rate (parsed from last jest run if available)
import fs from 'node:fs';
import path from 'node:path';

const SKIP = new Set([
  'node_modules','dist','build','.next','.git','.turbo','coverage',
  '.worktrees','.claude','stryker-tmp',
]);

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name) || e.name.startsWith('_audit_')) continue;
      walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

const BE_DIR = 'apps/api/src';
const FE_DIR = 'artifacts/erp-dashboard/src';

const beFiles = walk(BE_DIR).filter((f) => /\.(ts|tsx)$/.test(f));
const feFiles = walk(FE_DIR).filter((f) => /\.(ts|tsx)$/.test(f));

// ── BE: total routes via @Get/@Post/@Patch/@Put/@Delete decorators ──────────
let totalRoutes = 0;
const routeFiles = beFiles.filter((f) => f.includes('controller'));
for (const f of routeFiles) {
  const t = fs.readFileSync(f, 'utf8');
  totalRoutes += (t.match(/@(Get|Post|Put|Patch|Delete)\(/g) || []).length;
}

// ── BE: stub routes — return stub() or throw 501 ────────────────────────────
// Scan controllers only — stub() helper is the canonical pattern.
let beStubRoutes = 0;
const stubFileSet = new Set();
for (const f of routeFiles) {
  const t = fs.readFileSync(f, 'utf8');
  const stubCalls = (t.match(/\breturn\s+stub\(/g) || []).length;
  const directly501 = (t.match(/HttpStatus\.NOT_IMPLEMENTED\b/g) || []).length;
  // De-dup: stub() helper itself uses NOT_IMPLEMENTED. Avoid counting the helper file twice.
  const fileBudget = Math.max(stubCalls, directly501);
  if (fileBudget > 0) {
    beStubRoutes += stubCalls > 0 ? stubCalls : directly501;
    stubFileSet.add(f);
  }
}

// ── FE: pages count ─────────────────────────────────────────────────────────
const pagesDir = path.join(FE_DIR, 'pages');
const pagesFiles = [];
function walkPages(d) {
  try {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walkPages(p);
      else if (/\.tsx$/.test(e.name)) pagesFiles.push(p);
    }
  } catch {}
}
walkPages(pagesDir);
const totalPages = pagesFiles.length;

// Placeholder: file < 1500 chars AND contains "Coming soon" | "Soon" | "TODO"
let fePlaceholder = 0;
const phPattern = /Coming soon|TODO:|placeholder|Tez orada|Tayyorlanmoqda/i;
for (const p of pagesFiles) {
  const t = fs.readFileSync(p, 'utf8');
  if (t.length < 1500 && phPattern.test(t)) fePlaceholder++;
}

// ── Sidebar wired ───────────────────────────────────────────────────────────
const sidebarFiles = [
  path.join(FE_DIR, 'config/sidebar/constants.ts'),
  path.join(FE_DIR, 'config/sidebar/constants-groups-a.ts'),
  path.join(FE_DIR, 'config/sidebar/constants-groups-b.ts'),
];
const sidebarRoutes = new Set();
for (const f of sidebarFiles) {
  if (!fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/url\s*:\s*['"]([^'"]+)['"]/g)) sidebarRoutes.add(m[1]);
  for (const m of t.matchAll(/path\s*:\s*['"]([^'"]+)['"]/g)) sidebarRoutes.add(m[1]);
}

// ── FE imported pages (any page reachable from route registry) ─────────────
const routeRegistry = path.join(FE_DIR, 'App.tsx');
let routedPages = 0;
if (fs.existsSync(routeRegistry)) {
  const t = fs.readFileSync(routeRegistry, 'utf8');
  routedPages = (t.match(/lazy\(/g) || []).length + (t.match(/<Route\s/g) || []).length;
}

// ── Output ──────────────────────────────────────────────────────────────────
console.log('\n=== BACKEND ===');
console.log(`Total controller files:   ${routeFiles.length}`);
console.log(`Total routes (decorators):${totalRoutes}`);
console.log(`Files with stub routes:   ${stubFileSet.size}`);
console.log(`Stub routes (501):        ${beStubRoutes}`);
console.log(`Real (working) routes:    ${totalRoutes - beStubRoutes}`);
console.log(`Real ratio:               ${((1 - beStubRoutes / totalRoutes) * 100).toFixed(1)}%`);

console.log('\n=== FRONTEND ===');
console.log(`Total FE files:           ${feFiles.length}`);
console.log(`Total pages (.tsx):       ${totalPages}`);
console.log(`Placeholder/Coming-soon:  ${fePlaceholder}`);
console.log(`Real pages:               ${totalPages - fePlaceholder}`);
console.log(`Sidebar wired routes:     ${sidebarRoutes.size}`);
console.log(`<Route> entries in App.tsx: ${routedPages}`);
