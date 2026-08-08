/* To'lqin-5 additiv ustunlarni (tenant_id/deleted_at/deleted_by) jonli qo'llash —
   migrations-drift.ts dan ekstrakt, idempotent (ADD COLUMN IF NOT EXISTS). Boot ham shuni qiladi.
   Faqat ADDITIV — destructive yo'q. Drizzle-sxema <-> jonli DB mosligini ta'minlaydi. */
const fs = require('fs');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

const src = fs.readFileSync(path.join(__dirname, '..', 'apps', 'api', 'src', 'shared', 'db', 'invariants', 'migrations-drift.ts'), 'utf8');
// Faqat additiv tenant_id/deleted_at/deleted_by ADD COLUMN statementlari
const re = /ALTER TABLE IF EXISTS [a-z_]+ ADD COLUMN IF NOT EXISTS (?:tenant_id|deleted_at|deleted_by)[^`]*/g;
const stmts = [...new Set((src.match(re) || []).map(s => s.trim()))];

(async () => {
  const c = await pool.connect();
  let ok = 0, fail = 0;
  try {
    for (const s of stmts) {
      try { await c.query(s); ok++; }
      catch (e) { fail++; console.error('FAIL:', s.slice(0, 70), '->', e.message); }
    }
    console.log(`QO'LLANDI: ${ok} ok, ${fail} fail / jami ${stmts.length} additiv statement`);
    // Tasdiq: kritik jadvallarda tenant_id
    const r = await c.query(`SELECT
      (SELECT count(*) FROM information_schema.columns WHERE table_name='entries' AND column_name='tenant_id') entries_tid,
      (SELECT count(*) FROM information_schema.columns WHERE table_name='warehouse_stock' AND column_name='tenant_id') ws_tid,
      (SELECT count(*) FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='tenant_id') so_tid,
      (SELECT count(*) FROM information_schema.columns WHERE table_name='production_orders' AND column_name='tenant_id') po_tid`);
    console.log('TASDIQ tenant_id:', JSON.stringify(r.rows[0]));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
