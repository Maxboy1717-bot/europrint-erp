#!/usr/bin/env node
/**
 * gen-hidden.mjs — generate constants-hidden.ts containing the 171 routed-but-
 * not-in-sidebar pages, grouped by URL prefix, with auto-derived titles.
 */
import fs from 'node:fs';

const items = JSON.parse(fs.readFileSync('cat-routed-not-in-sidebar.json', 'utf8'));

// CamelCase / PascalCase to space-separated title
function titleize(s) {
  return s
    .split('/')
    .pop()
    .replace(/Page$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

// Group by URL prefix
const groups = {};
for (const it of items) {
  const prefix = it.url.split('/').filter(Boolean)[0] || 'root';
  (groups[prefix] = groups[prefix] || []).push(it);
}

const groupMeta = {
  hr:          { uz: 'HR',           icon: 'Users' },
  pos:         { uz: 'POS',          icon: 'Store' },
  sd:          { uz: 'Savdo',        icon: 'ShoppingCart' },
  wms:         { uz: 'WMS',          icon: 'Warehouse' },
  ai:          { uz: 'AI',           icon: 'BrainCircuit' },
  warehouse:   { uz: 'Ombor',        icon: 'Warehouse' },
  crm:         { uz: 'CRM',          icon: 'Users' },
  director:    { uz: 'Direktor',     icon: 'Crown' },
  finance:     { uz: 'Moliya',       icon: 'DollarSign' },
  integration: { uz: 'Integratsiya', icon: 'Plug' },
  admin:       { uz: 'Admin',        icon: 'Settings' },
  lms:         { uz: "Ta'lim",       icon: 'BookOpen' },
  courses:     { uz: 'Kurslar',      icon: 'BookOpen' },
  erp:         { uz: 'ERP',          icon: 'Building' },
  cfo:         { uz: 'CFO',          icon: 'DollarSign' },
  pp:          { uz: 'PP',           icon: 'Factory' },
  qc:          { uz: 'QC',           icon: 'CheckSquare' },
  print:       { uz: 'Print',        icon: 'Printer' },
};
const DEFAULT_META = { uz: '', icon: 'FileText' };

const lines = [];
lines.push('/** @module constants-hidden');
lines.push(' * @description "Yashirin sahifalar" moduli — routed bo\'lib lekin sidebar\'da yo\'q');
lines.push(' * sahifalar. Foydalanuvchi (IT direktor) bularni ko\'rib chiqib, bittalab');
lines.push(' * o\'chiradi yoki keraklisini boshqa modulga ko\'chiradi.');
lines.push(' *');
lines.push(' * AUTO-GENERATED — to regenerate: `node gen-hidden.mjs`.');
lines.push(' */');
lines.push('');
lines.push('import {');
lines.push('  Eye, Users, Store, ShoppingCart, Warehouse, BrainCircuit, Crown, DollarSign,');
lines.push('  Plug, Settings, BookOpen, Building, Factory, CheckSquare, Printer, FileText,');
lines.push('} from "lucide-react";');
lines.push('import { MenuGroup } from "./types";');
lines.push('');
lines.push('export const menuGroupsHidden: Record<string, MenuGroup> = {');
lines.push('  hidden: {');
lines.push('    title: "🔍 Yashirin sahifalar",');
lines.push('    icon: Eye,');

// Order prefixes by count (most pages first)
const sorted = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
const firstUrl = sorted[0][1][0].url.replace(/^\//, '');
lines.push(`    defaultUrl: "${firstUrl}",`);
lines.push('    items: [');

for (const [prefix, list] of sorted) {
  const meta = groupMeta[prefix] || { ...DEFAULT_META, uz: prefix.toUpperCase() };
  lines.push(`      { title: "${meta.uz.toUpperCase()} — ${list.length} ta", url: "", icon: ${meta.icon}, separator: true },`);
  for (const it of list) {
    const title = titleize(it.page).replace(/"/g, '\\"');
    const url = it.url.replace(/^\//, '').replace(/:[^/]+/g, '');  // strip path params
    lines.push(`      { title: "${title}", url: "${url}", icon: ${meta.icon} },`);
  }
}
lines.push('    ],');
lines.push('  },');
lines.push('};');
lines.push('');

fs.writeFileSync('artifacts/erp-dashboard/src/components/sidebar/constants-hidden.ts', lines.join('\n'));
console.log(`Wrote constants-hidden.ts: ${items.length} pages in ${sorted.length} prefix groups`);
