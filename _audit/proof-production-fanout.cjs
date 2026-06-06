/**
 * DB-proof: production fan-out — advance-approved order with product line-items creates production_orders.
 * Replicates SdOrderDepartmentsRepository.createProductionJob SQL. Proves: one production order per
 * product line-item (product_id, planned_quantity=order_quantity, sales_order_id link); idempotent
 * (re-run creates nothing). bom_id left NULL (BOM explosion is a later step). Temp rows; cleaned up.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

const JOB_SQL = (oid) => `
  INSERT INTO production_orders (order_number, product_id, planned_quantity, sales_order_id, status, created_at, updated_at)
  SELECT 'PRO-' || soi.sales_order_id || '-' || soi.item_number, soi.product_id, soi.order_quantity, soi.sales_order_id, 'created', NOW(), NOW()
  FROM sales_order_items soi
  WHERE soi.sales_order_id = ${oid} AND soi.product_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM production_orders po WHERE po.sales_order_id = soi.sales_order_id AND po.product_id = soi.product_id)
  RETURNING id`;

(async () => {
  let p1, p2, oid;
  try {
    p1 = (await pool.query(`INSERT INTO products (code,name,unit) VALUES ('__PRO_A__','PROOF Quti A','PC') RETURNING id`)).rows[0].id;
    p2 = (await pool.query(`INSERT INTO products (code,name,unit) VALUES ('__PRO_B__','PROOF Quti B','PC') RETURNING id`)).rows[0].id;
    oid = (await pool.query(`INSERT INTO sales_orders (order_number,status,created_at,updated_at) VALUES ('__PROFANOUT__','advance_paid',NOW(),NOW()) RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO sales_order_items (sales_order_id,item_number,product_id,description,order_quantity,open_quantity,unit,net_price,total_price,created_at)
      VALUES ($1,'000010',$2,'Quti A',1000,1000,'PC',500,500000,NOW()), ($1,'000020',$3,'Quti B',500,500,'PC',800,400000,NOW())`, [oid, p1, p2]);

    // first fan-out
    const first = (await pool.query(JOB_SQL(oid))).rows.length;
    // idempotency — re-fire
    const second = (await pool.query(JOB_SQL(oid))).rows.length;

    const pos = (await pool.query(
      `SELECT order_number, product_id, planned_quantity, sales_order_id, bom_id, status
       FROM production_orders WHERE sales_order_id=$1 ORDER BY order_number`, [oid])).rows;
    console.log('--- DB-PROOF: production fan-out (order line-items -> production_orders) ---');
    console.log('first fan-out created :', first, '(expect 2)');
    console.log('re-fire created       :', second, second === 0 ? '✅ idempotent' : '❌');
    for (const po of pos) {
      console.log(`  ${po.order_number} product_id=${po.product_id} planned=${po.planned_quantity} so=${po.sales_order_id} bom=${po.bom_id ?? 'NULL (deferred)'} status=${po.status}`);
    }
    const ok = first === 2 && second === 0 && pos.length === 2
      && pos.some(po => po.product_id === p1 && Number(po.planned_quantity) === 1000)
      && pos.some(po => po.product_id === p2 && Number(po.planned_quantity) === 500);

    await pool.query(`DELETE FROM production_orders WHERE sales_order_id=$1`, [oid]);
    await pool.query(`DELETE FROM sales_order_items WHERE sales_order_id=$1`, [oid]);
    await pool.query(`DELETE FROM sales_orders WHERE id=$1`, [oid]);
    await pool.query(`DELETE FROM products WHERE id IN ($1,$2)`, [p1, p2]);
    const left = (await pool.query(`SELECT (SELECT COUNT(*) FROM production_orders WHERE sales_order_id=$1)+(SELECT COUNT(*) FROM sales_orders WHERE id=$1) n`, [oid])).rows[0].n;
    console.log('cleanup remaining     :', Number(left), Number(left) === 0 ? '✅' : '❌');

    console.log(ok && Number(left) === 0
      ? '\n✅ PROOF PASSED — advance-approved order fans out to production: one production order per product line.'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { if (oid) { await pool.query(`DELETE FROM production_orders WHERE sales_order_id=$1`, [oid]); await pool.query(`DELETE FROM sales_order_items WHERE sales_order_id=$1`, [oid]); await pool.query(`DELETE FROM sales_orders WHERE id=$1`, [oid]); } if (p1) await pool.query(`DELETE FROM products WHERE id IN ($1,$2)`, [p1, p2]); } catch {}
  } finally { await pool.end(); }
})();
