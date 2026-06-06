/**
 * DB-proof STEP 5: MPS now reads product_id (COALESCE(product_id, material_id)).
 * A product-bound line-item (product_id set, material_id NULL) appears in the MPS committed-demand
 * query — whereas the OLD query (soi.material_id) would read NULL and miss it. Temp product + temp
 * order + line; cleaned up after.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

const NEW_SQL = (oid) => `
  SELECT COALESCE(soi.product_id, soi.material_id)::text AS product_id, COALESCE(soi.order_quantity,0)::numeric AS qty
  FROM sales_order_items soi JOIN sales_orders so ON so.id = soi.sales_order_id
  WHERE so.id = ${oid} AND so.status NOT IN ('cancelled','delivered')
    AND COALESCE(so.delivery_date::date, so.created_at::date) >= CURRENT_DATE - 28`;
const OLD_SQL = (oid) => `
  SELECT soi.material_id::text AS product_id FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id WHERE so.id = ${oid}`;

(async () => {
  let pid, oid;
  try {
    pid = (await pool.query(`INSERT INTO products (code, name, unit) VALUES ('__MPS_P__','PROOF MPS Quti','PC') RETURNING id`)).rows[0].id;
    oid = (await pool.query(`INSERT INTO sales_orders (order_number, status, created_at, updated_at) VALUES ('__MPSPROOF__','draft',NOW(),NOW()) RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO sales_order_items
      (sales_order_id, item_number, product_id, material_id, description, order_quantity, open_quantity, unit, net_price, total_price, created_at)
      VALUES ($1,'000010',$2,NULL,'MPS test mahsulot',777,777,'PC',1000,777000,NOW())`, [oid, pid]);

    const neu = (await pool.query(NEW_SQL(oid))).rows[0];
    const old = (await pool.query(OLD_SQL(oid))).rows[0];

    console.log('--- DB-PROOF STEP 5: MPS reads product_id ---');
    console.log('NEW MPS query (product_id):', neu ? `product_id=${neu.product_id} qty=${neu.qty}` : 'EMPTY ❌');
    console.log('OLD MPS query (material_id):', old ? `product_id=${old.product_id ?? 'NULL'}` : 'EMPTY', '(NULL = old MPS missed it)');
    const ok = neu && String(neu.product_id) === String(pid) && Number(neu.qty) === 777 && (old?.product_id == null);

    await pool.query(`DELETE FROM sales_order_items WHERE sales_order_id=$1`, [oid]);
    await pool.query(`DELETE FROM sales_orders WHERE id=$1`, [oid]);
    await pool.query(`DELETE FROM products WHERE id=$1`, [pid]);
    const left = (await pool.query(`SELECT (SELECT COUNT(*) FROM sales_orders WHERE id=$1)+(SELECT COUNT(*) FROM products WHERE id=$2) n`, [oid, pid])).rows[0].n;
    console.log('cleanup remaining :', Number(left), Number(left) === 0 ? '✅' : '❌');

    console.log(ok && Number(left) === 0
      ? '\n✅ PROOF PASSED — MPS now sees product-bound order line-items (was empty under material_id).'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { if (oid) { await pool.query(`DELETE FROM sales_order_items WHERE sales_order_id=$1`, [oid]); await pool.query(`DELETE FROM sales_orders WHERE id=$1`, [oid]); } if (pid) await pool.query(`DELETE FROM products WHERE id=$1`, [pid]); } catch {}
  } finally { await pool.end(); }
})();
