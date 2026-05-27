#!/usr/bin/env node
/**
 * schema-convergence-ledger.mjs  (v2 — column-type aware)
 *
 * For every duplicated table, compares the lib/db canonical def against the
 * apps/api stub def(s) at the COLUMN level (not just id), and classifies how
 * safe a "stub body -> re-export lib/db" convergence is:
 *   CLEAN        lib/db canon exists; every stub column is present in lib/db
 *                with a compatible JS type  -> safe re-export (no gate surprise)
 *   RECONCILE    lib/db canon exists but a column type conflicts (e.g. string vs
 *                number) or a stub column is missing in lib/db -> fix first
 *   PK-CONFLICT  id is uuid in one universe, integer/serial in the other (hard)
 *   NO-LIB-CANON no lib/db def -> cannot re-export to @workspace/db
 *
 * Output: docs/schema-convergence-ledger.md  +  _audit_out/convergence-ledger.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCAN = ['lib/db/src', 'apps/api/src/shared/db'];

function gitFiles(dirs) {
  const out = execSync('git ls-files ' + dirs.map((d) => `"${d}"`).join(' '), { cwd: root, encoding: 'utf8' });
  return out.split(/\r?\n/).filter((f) => f.endsWith('.ts'));
}

// drizzle column fn -> JS type category (string/number/bool/date/json/other)
function jsType(fn) {
  if (/^(text|varchar|char|uuid|citext)$/.test(fn)) return 'string';
  if (/^(decimal|numeric|numericMoney|money)$/.test(fn)) return 'string'; // drizzle numeric -> string
  if (/^(integer|serial|bigserial|smallserial|smallint|doublePrecision|real)$/.test(fn)) return 'number';
  if (/^bigint$/.test(fn)) return 'number';
  if (/^boolean$/.test(fn)) return 'bool';
  if (/^(timestamp|date|time)$/.test(fn)) return 'date';
  if (/^(jsonb|json)$/.test(fn)) return 'json';
  return 'other';
}

const DEF_RE = /export\s+const\s+(\w+)\s*=\s*pgTable\(\s*(?:\r?\n\s*)?["'`]([a-zA-Z0-9_]+)["'`]/g;
const COL_RE = /^\s{2,}(\w+):\s*(\w+)\(/gm; // column lines: `  key: fn(`

const defs = {}; // table -> [{file, sym, idType, cols:{key:jsType}}]
for (const rel of gitFiles(SCAN)) {
  let src;
  try { src = readFileSync(join(root, rel), 'utf8'); } catch { continue; }
  let m;
  DEF_RE.lastIndex = 0;
  while ((m = DEF_RE.exec(src))) {
    const sym = m[1], table = m[2];
    const body = src.slice(m.index, m.index + 3500);
    const end = body.indexOf('\n});');
    const colSrc = end > 0 ? body.slice(0, end) : body;
    const cols = {};
    let c;
    COL_RE.lastIndex = 0;
    while ((c = COL_RE.exec(colSrc))) cols[c[1]] = jsType(c[2]);
    (defs[table] = defs[table] || []).push({ file: rel, sym, idType: cols.id || '?', cols });
  }
}

const isLib = (f) => f.startsWith('lib/db/');
function consumers(syms) {
  let n = 0;
  for (const sy of [...new Set(syms)]) {
    try { n += execSync(`git grep -l -w "${sy}" -- "apps/api/src/modules"`, { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean).length; } catch { /* none */ }
  }
  return n;
}

const rows = [];
for (const [table, d] of Object.entries(defs)) {
  if (d.length < 2) continue;
  const libDef = d.find((x) => isLib(x.file));
  const apiDefs = d.filter((x) => !isLib(x.file));
  const cons = consumers(d.map((x) => x.sym));
  let verdict, conflicts = [], missing = [];
  if (!libDef) {
    verdict = 'NO-LIB-CANON';
  } else if (apiDefs.length === 0) {
    verdict = 'CLEAN'; // only lib/db defines it (dup is within lib/db) — trivial
  } else {
    // compare each apiDef to libDef
    const pkConflict = apiDefs.some((a) => {
      const L = libDef.idType, A = a.idType;
      const lNum = L === 'number', aNum = A === 'number';
      const lStr = L === 'string', aStr = A === 'string';
      return (lNum && aStr) || (lStr && aNum);
    });
    for (const a of apiDefs) {
      for (const [k, t] of Object.entries(a.cols)) {
        const lt = libDef.cols[k];
        if (lt === undefined) { if (!missing.includes(k)) missing.push(k); continue; }
        if (t !== 'other' && lt !== 'other' && t !== lt && !conflicts.find((x) => x.col === k))
          conflicts.push({ col: k, stub: t, lib: lt, file: a.file });
      }
    }
    if (pkConflict) verdict = 'PK-CONFLICT';
    else if (conflicts.length || missing.length) verdict = 'RECONCILE';
    else verdict = 'CLEAN';
  }
  rows.push({ table, verdict, cons, nDefs: d.length, idTypes: [...new Set(d.map((x) => x.idType))], conflicts, missing, libFile: libDef?.file, apiFiles: apiDefs.map((x) => x.file) });
}

const order = { CLEAN: 0, RECONCILE: 1, 'PK-CONFLICT': 2, 'NO-LIB-CANON': 3 };
rows.sort((a, b) => order[a.verdict] - order[b.verdict] || a.cons - b.cons || a.table.localeCompare(b.table));
const by = (v) => rows.filter((r) => r.verdict === v);

let md = `# Schema Convergence Ledger (v2 — column-type aware)\n\nGenerated ${new Date().toISOString().slice(0, 10)}. ${rows.length} duplicated tables.\n\n`;
md += `| verdict | count | meaning |\n|---|---|---|\n`;
md += `| CLEAN | ${by('CLEAN').length} | safe stub→re-export (lib/db ⊇ stub, compatible types) |\n`;
md += `| RECONCILE | ${by('RECONCILE').length} | column type conflict / missing col — fix lib/db or consumers first |\n`;
md += `| PK-CONFLICT | ${by('PK-CONFLICT').length} | uuid ↔ integer id — hard, per-table |\n`;
md += `| NO-LIB-CANON | ${by('NO-LIB-CANON').length} | no lib/db def — different strategy |\n\n`;
for (const v of ['CLEAN', 'RECONCILE', 'PK-CONFLICT', 'NO-LIB-CANON']) {
  md += `## ${v} (${by(v).length})\n\n| table | consumers | id types | conflicts / missing | api def files |\n|---|---|---|---|---|\n`;
  for (const r of by(v)) {
    const notes = [...r.conflicts.map((c) => `${c.col}:${c.stub}≠${c.lib}`), ...r.missing.map((c) => `+${c}?`)].slice(0, 6).join(', ');
    md += `| ${r.table} | ${r.cons} | ${r.idTypes.join('/')} | ${notes || '—'} | ${r.apiFiles.map((f) => f.replace('apps/api/src/shared/db/', '')).join(', ')} |\n`;
  }
  md += '\n';
}
writeFileSync(join(root, 'docs/schema-convergence-ledger.md'), md);
writeFileSync(join(root, '_audit_out/convergence-ledger.json'), JSON.stringify(rows, null, 1));
console.log(`dup=${rows.length}  CLEAN=${by('CLEAN').length}  RECONCILE=${by('RECONCILE').length}  PK-CONFLICT=${by('PK-CONFLICT').length}  NO-LIB-CANON=${by('NO-LIB-CANON').length}`);
