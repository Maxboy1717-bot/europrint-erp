/**
 * POS-1 DB-PROOF: GET /pos/stock/movements (-> StockLedgerService.getMovements ->
 * repo: SELECT pos_stock_ledger WHERE ts IS NOT NULL ORDER BY ts DESC LIMIT/OFFSET).
 * Insert a test movement -> run the exact repo query -> confirm it appears -> cleanup.
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
       VALUES (999999, 999999, NOW(), 7, 7, 'POS movements proof') RETURNING id`);
    id = ins.rows[0].id;
    console.log('1) INSERTED  : ledger id', id);
    // Mirror StockLedgerService.getMovements: ts IS NOT NULL, newest first, paginated
    const sel = await c.query(
      `SELECT id, warehouse_id, qty_change, balance_after, reason
       FROM pos_stock_ledger WHERE ts IS NOT NULL ORDER BY ts DESC LIMIT 50 OFFSET 0`);
    const found = sel.rows.find((r) => r.id === id);
    console.log('2) JOURNAL   :', sel.rows.length, 'movement row(s); test row present:', !!found);
    console.log('   row       :', JSON.stringify(found));
    const del = await c.query(`DELETE FROM pos_stock_ledger WHERE id=$1`, [id]);
    console.log('3) DELETED   :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM pos_stock_ledger WHERE id=$1`, [id])).rows[0].n;
    console.log('4) REMAINING :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (id) { try { await c.query(`DELETE FROM pos_stock_ledger WHERE id=$1`, [id]); } catch (_) {} }
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
