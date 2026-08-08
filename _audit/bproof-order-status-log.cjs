/**
 * iter-77 DB-PROOF (rollback-tx). order_status_logs.insertTransitionLog repair.
 * BUG: sales_order_id NOT NULL (no default) but INSERT only wrote legacy nullable order_id → 23502
 *      on every transition log (OrderStatusPage logging silently dead).
 * Proof: real sales_orders id → fixed INSERT (sales_order_id+order_id) → getStatusLog reader
 *        SELECT returns the row → ROLLBACK → count 0. Also prove OLD insert (without sales_order_id) fails.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
(async () => {
  const c = await pool.connect();
  try {
    const so = (await c.query(`SELECT id, status FROM sales_orders ORDER BY id LIMIT 1`)).rows[0];
    console.log('0) sales_order =', so ? `${so.id} (status=${so.status})` : 'NONE');
    if (!so) { await pool.end(); return; }
    const oid = String(so.id);

    // (A) prove OLD insert (no sales_order_id) FAILS
    await c.query('BEGIN');
    try {
      await c.query(
        `INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by, notes, created_at)
         SELECT id, status, $1, $2, $3, NOW() FROM sales_orders WHERE id::text = $4 RETURNING id`,
        ['PROOF_NEW', 1, 'iter77', oid],
      );
      console.log('A) OLD insert: UNEXPECTEDLY SUCCEEDED');
    } catch (e) {
      console.log('A) OLD insert FAILS as expected:', e.code, e.message.slice(0, 60));
    }
    await c.query('ROLLBACK');

    // (B) FIXED insert + reader
    await c.query('BEGIN');
    const ins = await c.query(
      `INSERT INTO order_status_logs (sales_order_id, order_id, from_status, to_status, changed_by, notes, created_at)
       SELECT id, id, status, $1, $2, $3, NOW() FROM sales_orders WHERE id::text = $4
       RETURNING id, sales_order_id, order_id, from_status, to_status`,
      ['PROOF_NEW', 1, 'iter77 proof', oid],
    );
    console.log('B) FIXED INSERT :', JSON.stringify(ins.rows[0]));

    // getStatusLog reader query (WHERE osl.order_id = $1)
    const read = await c.query(
      `SELECT osl.id, osl.sales_order_id, osl.order_id, osl.to_status,
              (u.first_name || ' ' || u.last_name) AS changed_by_name
       FROM order_status_logs osl LEFT JOIN users u ON u.id = osl.changed_by
       WHERE osl.order_id = $1 ORDER BY osl.created_at DESC`,
      [oid],
    );
    console.log('B) reader getStatusLog returns', read.rows.length, 'row(s):', JSON.stringify(read.rows[0] ?? null));
    await c.query('ROLLBACK');

    const rem = await c.query(`SELECT count(*)::int AS n FROM order_status_logs WHERE to_status='iter77 proof'`);
    console.log('C) ROLLBACK → remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
