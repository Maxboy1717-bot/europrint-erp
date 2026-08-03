/**
 * POS-2 DB-PROOF: /pos/inventory/low-stock + /pos/inventory/monthly-report.
 * low-stock = getAllStockSummary (latest balance per material/wh) filtered balance<=5.
 * monthly   = aggregate pos_stock_ledger by date_trunc('month', ts).
 * Insert a low-balance movement -> run both mirror queries -> confirm -> cleanup.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect();
  let id = null;
  try {
    const ins = await c.query(
      `INSERT INTO pos_stock_ledger (material_id, warehouse_id, ts, qty_change, balance_after, reason)
       VALUES (999999, 999999, NOW(), 3, 3, 'POS inventory proof') RETURNING id`);
    id = ins.rows[0].id;
    console.log('1) INSERTED  : ledger id', id, '(balance_after=3 -> low)');

    // low-stock mirror: latest balance per (material,warehouse) <= threshold(5)
    const low = await c.query(
      `SELECT material_id, warehouse_id, balance_after FROM (
         SELECT DISTINCT ON (material_id, warehouse_id) material_id, warehouse_id, balance_after
         FROM pos_stock_ledger ORDER BY material_id, warehouse_id, ts DESC
       ) s WHERE balance_after::numeric <= 5`);
    const lowHit = low.rows.find((r) => Number(r.material_id) === 999999);
    console.log('2) LOW-STOCK :', low.rows.length, 'item(s) <=5; test material present:', !!lowHit);

    // monthly-report mirror
    const mon = await c.query(
      `SELECT to_char(date_trunc('month', ts), 'YYYY-MM') AS month,
              COALESCE(SUM(CASE WHEN qty_change > 0 THEN qty_change ELSE 0 END), 0) AS in_qty,
              COUNT(*) AS movements
       FROM pos_stock_ledger WHERE ts IS NOT NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 24`);
    console.log('3) MONTHLY   :', mon.rows.length, 'month(s); top:', JSON.stringify(mon.rows[0]));

    const del = await c.query(`DELETE FROM pos_stock_ledger WHERE id=$1`, [id]);
    console.log('4) DELETED   :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM pos_stock_ledger WHERE id=$1`, [id])).rows[0].n;
    console.log('5) REMAINING :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (id) { try { await c.query(`DELETE FROM pos_stock_ledger WHERE id=$1`, [id]); } catch (_) {} }
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
