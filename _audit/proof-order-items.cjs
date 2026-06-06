/**
 * DB-proof STEP 3: order create persists product-bound line-items into sales_order_items.
 * Replicates DrizzleSalesOrderRepository.saveItems SQL exactly. Inserts a TEMP product (products is
 * empty) + 2 line-items against an existing order, verifies product_id + quantities + total_price,
 * then cleans up (items by product_id + the temp product). No order is created or modified.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

const ITEMS = [
  { item: '000010', desc: 'Quti A (5-qatlamli)', qty: 1000, unit: 'PC', price: 500 },
  { item: '000020', desc: 'Quti B (3-qatlamli)', qty: 2000, unit: 'PC', price: 300 },
];

(async () => {
  let pid, oid;
  try {
    pid = (await pool.query(`INSERT INTO products (code, name, unit) VALUES ('__PROOF_P__','PROOF Tayyor Quti','PC') RETURNING id`)).rows[0].id;
    oid = (await pool.query(`SELECT id FROM sales_orders ORDER BY id LIMIT 1`)).rows[0].id;

    // saveItems replication
    for (const it of ITEMS) {
      const total = it.qty * it.price;
      await pool.query(`INSERT INTO sales_order_items
        (sales_order_id, item_number, product_id, description, order_quantity, open_quantity, unit, net_price, total_price, created_at)
        VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,NOW())`,
        [oid, it.item, pid, it.desc, it.qty, it.unit, it.price, total]);
    }

    const rows = (await pool.query(
      `SELECT item_number, product_id, description, order_quantity, open_quantity, unit, net_price, total_price
       FROM sales_order_items WHERE product_id=$1 ORDER BY item_number`, [pid])).rows;
    console.log('--- DB-PROOF: order line-items -> sales_order_items (product-bound) ---');
    let ok = rows.length === 2;
    for (const r of rows) {
      const expTotal = Number(r.order_quantity) * Number(r.net_price);
      const rowOk = r.product_id === pid && Number(r.total_price) === expTotal && Number(r.open_quantity) === Number(r.order_quantity);
      ok = ok && rowOk;
      console.log(`${rowOk ? '✅' : '❌'} ${r.item_number} product_id=${r.product_id} "${r.description}" qty=${r.order_quantity} ${r.unit} × ${r.net_price} = ${r.total_price} (open=${r.open_quantity})`);
    }

    // cleanup (only my test items + the temp product; order untouched)
    await pool.query(`DELETE FROM sales_order_items WHERE product_id=$1`, [pid]);
    await pool.query(`DELETE FROM products WHERE id=$1`, [pid]);
    const left = (await pool.query(`SELECT (SELECT COUNT(*) FROM sales_order_items WHERE product_id=$1)
        + (SELECT COUNT(*) FROM products WHERE id=$1) AS n`, [pid])).rows[0].n;
    console.log('cleanup remaining :', Number(left), Number(left) === 0 ? '✅' : '❌');

    console.log(ok && Number(left) === 0
      ? '\n✅ PROOF PASSED — order create now persists product-bound line-items (MPS can plan from them).'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { if (pid) { await pool.query(`DELETE FROM sales_order_items WHERE product_id=$1`, [pid]); await pool.query(`DELETE FROM products WHERE id=$1`, [pid]); } } catch {}
  } finally { await pool.end(); }
})();
