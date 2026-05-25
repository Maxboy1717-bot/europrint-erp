#!/usr/bin/env node
/**
 * delete-hidden-v2.mjs — safe deletion that preserves shared components.
 *
 *   Phase A: Remove the 142 hidden route tuples from *Routes.tsx
 *   Phase B: Detect components that are NO LONGER referenced anywhere
 *   Phase C: Delete only those truly-orphan page files + their siblings
 *   Phase D: Regenerate constants-hidden.ts with 29 KEEP entries
 *
 * This way shared pages (e.g. EmployeeProfile used by both `/employees/:id`
 * AND `/erp/employee/:id`) survive — only the hidden URL is removed.
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/pages');
const ROUTES_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/routes');

const KEEP = new Set([
  'hr/inspection',
  'hr/succession-planning',
  'hr/leave',
  'pos/movements',
  'pos/requests',
  'sd/debitors',
  'wms/analytics',
  'wms/reports-all',
  'ai/agents',
  'ai',
  'finance/gl-chart-of-accounts',
  'qc/dashboard-home',
  'qc/paper-parameters',
  'attendance-monitor',
  'security',
  'iot-enhanced',
  'tech-cards',
  'tech-approval',
  'weekly-plans',
  'waste',
  'users',
  'quality-defects-camera',
  'production/shift-reports',
  'production-facts',
  'machine-status-current',
  'iot-sensors',
  'gl',
  'employee-zone-history',
  '3way-match',
]);

const items = JSON.parse(fs.readFileSync('cat-routed-not-in-sidebar.json', 'utf8'));
const normalizeUrl = (u) => u.replace(/^\//, '').replace(/\/:[^/]+/g, '');

const keep = items.filter(it => KEEP.has(normalizeUrl(it.url)));
const del  = items.filter(it => !KEEP.has(normalizeUrl(it.url)));

console.log(`KEEP: ${keep.length}, DELETE: ${del.length}`);

// ─── PHASE A: Remove route tuples from all *Routes.tsx + AppRouter.tsx ────
const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.tsx'));
const routeContents = {};
for (const f of routeFiles) {
  routeContents[f] = fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8');
}

let tuplesRemoved = 0;
for (const it of del) {
  const escapedUrl = it.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tupleRe = new RegExp(`\\s*\\[\\s*['"]${escapedUrl}['"]\\s*,\\s*${it.page}\\s*\\],?\\n?`, 'g');
  for (const [file, content] of Object.entries(routeContents)) {
    const before = content;
    const after = content.replace(tupleRe, '\n');
    if (after !== before) {
      routeContents[file] = after;
      tuplesRemoved++;
      break;
    }
  }
}
console.log(`Phase A — route tuples removed: ${tuplesRemoved}`);

// ─── PHASE B: For each route file, find lazy imports whose component is no
// longer referenced anywhere → remove the lazy declaration
let lazyRemoved = 0;
const componentsToDeleteFile = new Set();

for (const [file, content] of Object.entries(routeContents)) {
  let c = content;
  const lazyRe = /^\s*const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]@\/pages\/([^'"]+)['"]\)\);?\s*\n/gm;
  const matches = [...c.matchAll(lazyRe)];
  for (const m of matches) {
    const compName = m[1];
    const pagePath = m[2];
    // After this lazy declaration is hypothetically removed, is compName referenced anywhere else?
    const remainder = c.replace(m[0], '');
    const usageRe = new RegExp(`\\b${compName}\\b`, 'g');
    const usageCount = (remainder.match(usageRe) || []).length;
    if (usageCount === 0) {
      c = c.replace(m[0], '');
      lazyRemoved++;
      componentsToDeleteFile.add(pagePath);
    }
  }
  routeContents[file] = c;
}
console.log(`Phase B — orphan lazy imports removed: ${lazyRemoved}`);
console.log(`Phase B — page paths to consider for file deletion: ${componentsToDeleteFile.size}`);

// ─── PHASE C: Cross-check: components used by ANY remaining route across ALL
// route files are still alive — only truly-orphan ones get their files deleted.
const allRoutesText = Object.values(routeContents).join('\n');
const stillUsed = new Set();
for (const compPath of componentsToDeleteFile) {
  // Check if this path is imported anywhere (in any route file)
  const importRe = new RegExp(`['"]@\\/pages\\/${compPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  if (importRe.test(allRoutesText)) {
    stillUsed.add(compPath);
  }
}
for (const u of stillUsed) componentsToDeleteFile.delete(u);
console.log(`Phase C — components still imported by surviving routes: ${stillUsed.size}`);
console.log(`Phase C — truly orphan to delete: ${componentsToDeleteFile.size}`);

// ─── Also check: components used by any other .tsx file in the codebase
// (some pages import other pages directly)
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { yield* walk(full); }
    else if (e.isFile() && (full.endsWith('.tsx') || full.endsWith('.ts'))) yield full;
  }
}

const referencedBySrc = new Set();
const srcRoot = path.join(ROOT, 'artifacts/erp-dashboard/src');
for (const file of walk(srcRoot)) {
  if (file.includes('routes/')) continue; // already accounted
  const content = fs.readFileSync(file, 'utf8');
  for (const compPath of componentsToDeleteFile) {
    // skip if already known to be alive
    if (referencedBySrc.has(compPath)) continue;
    const importRe = new RegExp(`['"]@\\/pages\\/${compPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
    const relRe = new RegExp(`['"]\\.\\.?/(?:pages/)?${path.basename(compPath).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
    if (importRe.test(content) || relRe.test(content)) {
      referencedBySrc.add(compPath);
    }
  }
}
for (const r of referencedBySrc) componentsToDeleteFile.delete(r);
console.log(`Phase C — components referenced by other src files (saved): ${referencedBySrc.size}`);
console.log(`Phase C — final delete count: ${componentsToDeleteFile.size}`);

// ─── PHASE D: Delete page files
const SIBLING_PATTERNS = [
  '', 'Sections', 'Sections2', 'Sections3', 'SectionsA', 'SectionsB',
  'SectionsExtra', 'SectionsMore', 'Tabs', 'TabsA', 'TabsB', 'TabsC', 'TabsD',
  'Helpers', 'Types', 'Dialogs', 'Forms', 'Panels', 'Chart', 'Charts', 'Cards',
  'FormDialog', 'Hooks', 'Utils', 'Constants', 'Detail', 'DetailDialog',
  'Step1', 'Step2', 'Step3', 'Step4', 'Extra', 'Overview', 'Table', 'Tables',
  'Analytics', 'POSPanel',
];

let filesDeleted = 0;
const deleted = [];
for (const compPath of componentsToDeleteFile) {
  const dir = path.dirname(path.join(PAGES_DIR, compPath));
  const baseName = path.basename(compPath);
  for (const suffix of SIBLING_PATTERNS) {
    for (const ext of ['.tsx', '.ts', '.smoke.test.tsx', '.test.tsx']) {
      const fname = `${baseName}${suffix}${ext}`;
      const full = path.join(dir, fname);
      if (fs.existsSync(full)) {
        if (!DRY) fs.unlinkSync(full);
        deleted.push(path.relative(PAGES_DIR, full));
        filesDeleted++;
      }
    }
  }
  // __tests__/<name>.test.tsx
  const testFile = path.join(PAGES_DIR, '__tests__', `${baseName}.test.tsx`);
  if (fs.existsSync(testFile)) {
    if (!DRY) fs.unlinkSync(testFile);
    deleted.push(path.relative(PAGES_DIR, testFile));
    filesDeleted++;
  }
}
console.log(`Phase D — files deleted: ${filesDeleted}`);
if (deleted.length <= 40) deleted.forEach(d => console.log(`  - ${d}`));

// ─── Write back route files
if (!DRY) {
  for (const [file, content] of Object.entries(routeContents)) {
    fs.writeFileSync(path.join(ROUTES_DIR, file), content);
  }
}

// ─── PHASE E: Regenerate constants-hidden.ts with KEEP only
const groupMeta = {
  hr:          { uz: 'HR',           icon: 'Users' },
  pos:         { uz: 'POS',          icon: 'Store' },
  sd:          { uz: 'Savdo',        icon: 'ShoppingCart' },
  wms:         { uz: 'WMS',          icon: 'Warehouse' },
  ai:          { uz: 'AI',           icon: 'BrainCircuit' },
  qc:          { uz: 'QC',           icon: 'CheckSquare' },
  finance:     { uz: 'Moliya',       icon: 'DollarSign' },
  production:  { uz: 'Ishlab chiqarish', icon: 'Factory' },
};
const DEFAULT_META = { uz: 'Boshqa', icon: 'FileText' };

function titleize(s) {
  return s.split('/').pop().replace(/Page$/, '').replace(/([A-Z])/g, ' $1').trim();
}

const groups = {};
for (const it of keep) {
  const prefix = it.url.split('/').filter(Boolean)[0] || 'root';
  (groups[prefix] = groups[prefix] || []).push(it);
}

const lines = [];
lines.push('/** @module constants-hidden');
lines.push(' * @description 29 ta tasdiqlangan "yashirin" sahifa — IT direktor');
lines.push(' * tomonidan tanlangan, kelajakda asosiy modullarga ko\'chirilishi kerak.');
lines.push(' * Qolgan 142 ta sahifa kod bilan birga butunlay o\'chirildi.');
lines.push(' */');
lines.push('');
lines.push('import {');
lines.push('  Eye, Users, Store, ShoppingCart, Warehouse, BrainCircuit, DollarSign,');
lines.push('  Factory, CheckSquare, FileText,');
lines.push('} from "lucide-react";');
lines.push('import { MenuGroup } from "./types";');
lines.push('');
lines.push('export const menuGroupsHidden: Record<string, MenuGroup> = {');
lines.push('  hidden: {');
lines.push('    title: "🔍 Yashirin sahifalar",');
lines.push('    icon: Eye,');
const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
const firstUrl = sorted[0]?.[1]?.[0]?.url.replace(/^\//, '') ?? 'hr/inspection';
lines.push(`    defaultUrl: "${firstUrl}",`);
lines.push('    items: [');
for (const [prefix, list] of sorted) {
  const meta = groupMeta[prefix] || { ...DEFAULT_META, uz: prefix.toUpperCase() };
  lines.push(`      { title: "${meta.uz.toUpperCase()} — ${list.length} ta", url: "", icon: ${meta.icon}, separator: true },`);
  for (const it of list) {
    const title = titleize(it.page).replace(/"/g, '\\"');
    const url = it.url.replace(/^\//, '').replace(/:[^/]+/g, '');
    lines.push(`      { title: "${title}", url: "${url}", icon: ${meta.icon} },`);
  }
}
lines.push('    ],');
lines.push('  },');
lines.push('};');
lines.push('');

if (!DRY) {
  fs.writeFileSync('artifacts/erp-dashboard/src/components/sidebar/constants-hidden.ts', lines.join('\n'));
}
console.log(`Phase E — regenerated constants-hidden.ts with ${keep.length} kept entries`);
console.log(DRY ? '\n(DRY RUN — no files changed)' : '\nDone.');
