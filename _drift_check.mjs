// Drizzle <-> DB drift checker (REPORT-ONLY)
import fs from 'fs';
import path from 'path';

const ROOTS = ['lib/db/src/schema', 'apps/api/src'];
const TYPE_BUILDERS = new Set([
  'serial','bigserial','smallserial','integer','int','bigint','smallint',
  'varchar','text','char','boolean','timestamp','timestamptz','date','time',
  'numeric','decimal','real','doublePrecision','json','jsonb','uuid','inet',
  'cidr','macaddr','interval','customType','pgEnum','doublePrecision'
]);

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '__tests__') continue;
      walk(p, acc);
    } else if (/\.ts$/.test(e.name) && !/\.(spec|test|d)\.ts$/.test(e.name)) {
      acc.push(p);
    }
  }
  return acc;
}

const files = [];
for (const r of ROOTS) walk(r, files);

// Find balanced object body starting at index of '{'
function readObject(src, openIdx) {
  let depth = 0, i = openIdx;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return src.slice(openIdx);
}

// table name -> { cols:Set, files:Set }
const drizzle = new Map();
const reTable = /pgTable\(\s*["'`]([^"'`]+)["'`]\s*,\s*(\{)/g;
const reCol = /(\w+)\s*:\s*([A-Za-z]+)\s*\(\s*["'`]([^"'`]+)["'`]/g;

for (const f of files) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  let m;
  while ((m = reTable.exec(src))) {
    const tname = m[1];
    const braceIdx = m.index + m[0].length - 1;
    const body = readObject(src, braceIdx);
    if (!drizzle.has(tname)) drizzle.set(tname, { cols: new Set(), files: new Set() });
    const rec = drizzle.get(tname);
    rec.files.add(f.replace(/\\/g, '/'));
    let c;
    reCol.lastIndex = 0;
    while ((c = reCol.exec(body))) {
      const builder = c[2];
      const dbcol = c[3];
      if (TYPE_BUILDERS.has(builder)) rec.cols.add(dbcol);
    }
  }
}

// Load DB
const dbTables = new Set(fs.readFileSync('_db_tables.txt', 'utf8').split('\n').map(s => s.trim()).filter(Boolean));
const dbCols = new Map(); // table -> Set(cols)
for (const line of fs.readFileSync('_db_cols.txt', 'utf8').split('\n')) {
  const idx = line.indexOf('.');
  if (idx < 0) continue;
  const t = line.slice(0, idx).trim();
  const c = line.slice(idx + 1).trim();
  if (!dbCols.has(t)) dbCols.set(t, new Set());
  dbCols.get(t).add(c);
}

const missingTables = [];
const missingCols = [];
for (const [t, rec] of drizzle) {
  if (!dbTables.has(t)) {
    missingTables.push({ table: t, files: [...rec.files] });
    continue;
  }
  const cols = dbCols.get(t) || new Set();
  for (const col of rec.cols) {
    if (!cols.has(col)) missingCols.push({ table: t, col, files: [...rec.files] });
  }
}

console.log('=== SUMMARY ===');
console.log('Drizzle pgTable (unique names):', drizzle.size);
console.log('DB tables+views:', dbTables.size);
console.log('Drizzle tables MISSING in DB:', missingTables.length);
console.log('Drizzle columns MISSING in DB (on existing tables):', missingCols.length);

console.log('\n=== MISSING TABLES (referenced in code, absent in DB) ===');
for (const x of missingTables.sort((a,b)=>a.table.localeCompare(b.table))) {
  console.log(`  ${x.table}  <-  ${x.files.map(f=>f.replace('apps/api/src/','api:').replace('lib/db/src/schema/','db:')).join(', ')}`);
}

console.log('\n=== MISSING COLUMNS (table exists, column absent in DB) ===');
const byTable = {};
for (const x of missingCols) (byTable[x.table] ??= []).push(x.col);
for (const t of Object.keys(byTable).sort()) {
  console.log(`  ${t}: ${byTable[t].join(', ')}`);
}
