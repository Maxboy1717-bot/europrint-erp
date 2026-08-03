/**
 * POS-3 DB-PROOF: GET /pos/sales/daily (-> CashRegisterService.getDailySales ->
 * repo.findDailySales: aggregate retail_pos_transactions WHERE created_at in [day) AND completed).
 * Insert a completed sale today -> run the mirror aggregate -> confirm count/total -> cleanup.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect();
  let id = null;
  try {
    const ins = await c.query(
      `INSERT INTO retail_pos_transactions
         (transaction_number, items, subtotal, discount_amount, tax_rate, tax_amount, total_amount, payment_method, status, created_at)
       VALUES ('PROOF-TXN-DAILY', '[]'::jsonb, 5000, 0, 12, 535, 5000, 'cash', 'completed', NOW())
       RETURNING id`);
    id = ins.rows[0].id;
    console.log('1) INSERTED  : txn id', id, '(total 5000, cash, completed, today)');

    // mirror findDailySales: today window + completed
    const totals = (await c.query(
      `SELECT COALESCE(SUM(total_amount::numeric),0) AS total, COUNT(*) AS count
       FROM retail_pos_transactions
       WHERE created_at >= date_trunc('day', NOW()) AND created_at < date_trunc('day', NOW()) + interval '1 day'
         AND status='completed'`)).rows[0];
    console.log('2) DAILY AGG :', JSON.stringify(totals), '(count>=1, total>=5000)');

    const byMethod = await c.query(
      `SELECT payment_method AS method, COUNT(*) AS count, COALESCE(SUM(total_amount::numeric),0) AS total
       FROM retail_pos_transactions
       WHERE created_at >= date_trunc('day', NOW()) AND created_at < date_trunc('day', NOW()) + interval '1 day'
         AND status='completed' GROUP BY payment_method`);
    console.log('3) BY METHOD :', JSON.stringify(byMethod.rows));

    const del = await c.query(`DELETE FROM retail_pos_transactions WHERE id=$1`, [id]);
    console.log('4) DELETED   :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM retail_pos_transactions WHERE id=$1`, [id])).rows[0].n;
    console.log('5) REMAINING :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (id) { try { await c.query(`DELETE FROM retail_pos_transactions WHERE id=$1`, [id]); } catch (_) {} }
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
