// Final safe additive batch: add genuinely-missing camelCase columns to lib/db
// defs (additive, harmless to existing consumers) then re-export the stub.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const S = 'lib/db/src/schema/', A = 'apps/api/src/shared/db/';
const targets = [
  { t: 'customer_orders', lib: S + 'ecommerce-schema.ts', api: A + 'schema-compat-4.ts', cols: ['deletedAt'] },
  { t: 'portfolio_items', lib: S + 'ecommerce-schema.ts', api: A + 'schema-compat-4.ts', cols: ['deletedAt'] },
  { t: 'website_pages', lib: S + 'ecommerce-schema.ts', api: A + 'schema-compat-4.ts', cols: ['deletedAt'] },
  { t: 'public_products', lib: S + 'ecommerce-schema.ts', api: A + 'schema-compat-4.ts', cols: ['updatedAt', 'deletedAt'] },
  { t: 'website_banners', lib: S + 'ecommerce-schema.ts', api: A + 'schema-compat-3.ts', cols: ['updatedAt'] },
  { t: 'mm_deliveries', lib: S + 'mm-logistics.ts', api: A + 'schema-compat-4.ts', cols: ['purchaseOrderId', 'vendorId'] },
  { t: 'product_categories', lib: S + 'pp/pp-enhanced.ts', api: A + 'schema-compat-3.ts', cols: ['updatedAt'] },
  { t: 'sd_orders', lib: S + 'sd-europrint-schema.ts', api: A + 'schema-compat-4.ts', cols: ['createdBy'] },
];
const snake = (s) => s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
const colDef = (k) => /At$/.test(k) ? `  ${k}: timestamp("${snake(k)}"),` : `  ${k}: integer("${snake(k)}"),`;

// add columns to the lib/db table's column object (before its matching `}`)
function addCols(libAbs, table, cols) {
  let src = readFileSync(libAbs, 'utf8');
  const m = new RegExp(`pgTable\\(\\s*["'\`]${table}["'\`]\\s*,\\s*\\{`).exec(src);
  if (!m) return `def not found: ${table}`;
  let i = m.index + m[0].length - 1, depth = 0, q = null; // at the `{`
  for (; i < src.length; i++) {
    const ch = src[i], prev = src[i - 1];
    if (q) { if (ch === q && prev !== '\\') q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  const present = src.slice(m.index, i);
  const toAdd = cols.filter((c) => !new RegExp(`\\b${c}:`).test(present));
  if (!toAdd.length) return `already present: ${table}`;
  const ins = '  // convergence: live-DB columns added (additive)\n' + toAdd.map(colDef).join('\n') + '\n';
  writeFileSync(libAbs, src.slice(0, i) + ins + src.slice(i));
  return `+${toAdd.join(',')} -> ${table}`;
}
// resolve lib export symbol for a table
function libSymOf(libAbs, table) {
  const m = new RegExp(`export const (\\w+)\\s*=\\s*pgTable\\(\\s*["'\`]${table}["'\`]`).exec(readFileSync(libAbs, 'utf8'));
  return m ? m[1] : null;
}
function reexport(apiAbs, table, libSym) {
  let src = readFileSync(apiAbs, 'utf8');
  const sm = new RegExp(`export const (\\w+)\\s*=\\s*pgTable\\(\\s*["'\`]${table}["'\`]`).exec(src);
  if (!sm) return `stub not found: ${table}`;
  const stub = sm[1];
  // balanced ) ;
  let i = sm.index; i = src.indexOf('pgTable(', i) + 'pgTable('.length - 1;
  let depth = 0, q = null;
  for (; i < src.length; i++) { const ch = src[i], p = src[i - 1]; if (q) { if (ch === q && p !== '\\') q = null; continue; } if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; } if (ch === '(') depth++; else if (ch === ')') { depth--; if (depth === 0) { i++; break; } } }
  while (i < src.length && src[i] !== ';') i++;
  const exp = libSym === stub ? `export { ${stub} } from '@workspace/db';` : `export { ${libSym} as ${stub} } from '@workspace/db';`;
  writeFileSync(apiAbs, src.slice(0, sm.index) + `// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md\n${exp}` + src.slice(i + 1));
  return `${table}: ${exp}`;
}

for (const x of targets) {
  console.log('ADD', addCols(join(root, x.lib), x.t, x.cols));
  const sym = libSymOf(join(root, x.lib), x.t);
  console.log('  RE', sym ? reexport(join(root, x.api), x.t, sym) : 'no lib sym');
}
