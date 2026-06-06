/**
 * DB-proof: BOM material explosion (production order -> bom_items -> ow_material_requirements).
 * Replicates createProductionJob's explosion SQL. Temp product + BOM (2 components: M1 qty 2 scrap 0,
 * M2 qty 5 scrap 10%) + order line (1000). Expects material reqs: M1 = 2*1000 = 2000; M2 =
 * 5*1000*1.1 = 5500. Idempotent (re-run creates nothing). Graceful: a product with no BOM explodes nothing.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const M1 = 1, M2 = 2; // real material_cards ids (component_id -> material_cards FK)

const PROD_SQL = (oid) => `
  INSERT INTO production_orders (order_number, product_id, planned_quantity, sales_order_id, status, created_at, updated_at)
  SELECT 'PRO-' || soi.sales_order_id || '-' || soi.item_number, soi.product_id, soi.order_quantity, soi.sales_order_id, 'created', NOW(), NOW()
  FROM sales_order_items soi WHERE soi.sales_order_id = ${oid} AND soi.product_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM production_orders po WHERE po.sales_order_id=soi.sales_order_id AND po.product_id=soi.product_id)
  RETURNING id`;
const EXPLODE_SQL = (oid) => `
  INSERT INTO ow_material_requirements (id, order_id, material_id, qty_required, qty_reserved, qty_issued, lab_passed, status)
  SELECT gen_random_uuid(), po.sales_order_id, bi.component_id::text, (bi.quantity * po.planned_quantity * (1 + COALESCE(bi.scrap_percentage,0)/100))::numeric, 0, 0, false, 'NEEDED'
  FROM production_orders po JOIN bom_headers bh ON bh.product_id = po.product_id
  JOIN bom_items bi ON bi.bom_id = bh.id AND bi.deleted_at IS NULL
  WHERE po.sales_order_id = ${oid}
    AND NOT EXISTS (SELECT 1 FROM ow_material_requirements mr WHERE mr.order_id=po.sales_order_id AND mr.material_id=bi.component_id::text)
  RETURNING id`;

(async () => {
  let pid, bid, oid;
  try {
    pid = (await pool.query(`INSERT INTO products (code,name,unit) VALUES ('__BOM_P__','PROOF Quti (BOM)','PC') RETURNING id`)).rows[0].id;
    bid = (await pool.query(`INSERT INTO bom_headers (bom_number, product_id, version, status) VALUES ('__BOMPROOF__',$1,'1','active') RETURNING id`, [pid])).rows[0].id;
    await pool.query(`INSERT INTO bom_items (bom_id,item_number,component_type,component_id,quantity,unit,scrap_percentage,position)
      VALUES ($1,'10','material',$2,2,'kg',0,1), ($1,'20','material',$3,5,'kg',10,2)`, [bid, M1, M2]);
    oid = (await pool.query(`INSERT INTO sales_orders (order_number,status,created_at,updated_at) VALUES ('__BOMFAN__','advance_paid',NOW(),NOW()) RETURNING id`)).rows[0].id;
    await pool.query(`INSERT INTO sales_order_items (sales_order_id,item_number,product_id,description,order_quantity,open_quantity,unit,net_price,total_price,created_at)
      VALUES ($1,'000010',$2,'BOM test',1000,1000,'PC',500,500000,NOW())`, [oid, pid]);

    await pool.query(PROD_SQL(oid));            // production order
    const firstExplode = (await pool.query(EXPLODE_SQL(oid))).rows.length;
    const secondExplode = (await pool.query(EXPLODE_SQL(oid))).rows.length; // idempotency

    const reqs = (await pool.query(`SELECT material_id, qty_required FROM ow_material_requirements WHERE order_id=$1 AND material_id IN ($2,$3) ORDER BY material_id`, [oid, String(M1), String(M2)])).rows;
    console.log('--- DB-PROOF: BOM material explosion (production -> materials) ---');
    console.log('exploded rows (1st):', firstExplode, '(expect 2)');
    console.log('re-run rows        :', secondExplode, secondExplode === 0 ? '✅ idempotent' : '❌');
    const m1 = reqs.find(r => r.material_id === String(M1)); const m2 = reqs.find(r => r.material_id === String(M2));
    console.log(`  M1 (qty 2, scrap 0)  -> ${m1 && m1.qty_required} (expect 2000)`);
    console.log(`  M2 (qty 5, scrap 10%) -> ${m2 && m2.qty_required} (expect 5500)`);
    const ok = firstExplode === 2 && secondExplode === 0 && m1 && Number(m1.qty_required) === 2000 && m2 && Number(m2.qty_required) === 5500;

    await pool.query(`DELETE FROM ow_material_requirements WHERE order_id=$1`, [oid]);
    await pool.query(`DELETE FROM production_orders WHERE sales_order_id=$1`, [oid]);
    await pool.query(`DELETE FROM sales_order_items WHERE sales_order_id=$1`, [oid]);
    await pool.query(`DELETE FROM sales_orders WHERE id=$1`, [oid]);
    await pool.query(`DELETE FROM bom_items WHERE bom_id=$1`, [bid]);
    await pool.query(`DELETE FROM bom_headers WHERE id=$1`, [bid]);
    await pool.query(`DELETE FROM products WHERE id=$1`, [pid]);
    console.log(ok ? '\n✅ PROOF PASSED — production order explodes its product BOM into material requirements (qty*planned*scrap).'
                   : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { if (oid) { await pool.query(`DELETE FROM ow_material_requirements WHERE order_id=$1`, [oid]); await pool.query(`DELETE FROM production_orders WHERE sales_order_id=$1`, [oid]); await pool.query(`DELETE FROM sales_order_items WHERE sales_order_id=$1`, [oid]); await pool.query(`DELETE FROM sales_orders WHERE id=$1`, [oid]); } if (bid) { await pool.query(`DELETE FROM bom_items WHERE bom_id=$1`, [bid]); await pool.query(`DELETE FROM bom_headers WHERE id=$1`, [bid]); } if (pid) await pool.query(`DELETE FROM products WHERE id=$1`, [pid]); } catch {}
  } finally { await pool.end(); }
})();
