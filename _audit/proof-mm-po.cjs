const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    const ins = await c.query(`INSERT INTO mm_purchase_orders (po_number, vendor_id, order_date, status, total_amount, currency) VALUES ('PO-PROOF-MM',99,'2026-06-05','draft',500000,'UZS') RETURNING id`);
    id = ins.rows[0].id;
    console.log('0) CREATED  : PO', id, '(draft)');
    const got = (await c.query(`SELECT id, status, total_amount FROM mm_purchase_orders WHERE id=$1`, [id])).rows[0];
    console.log('1) GET      :', JSON.stringify(got));
    // update (draft only) — notes + vendor
    await c.query(`UPDATE mm_purchase_orders SET notes=COALESCE('proof izoh',notes), vendor_id=COALESCE(88,vendor_id) WHERE id=$1`, [id]);
    const upd = (await c.query(`SELECT notes, vendor_id FROM mm_purchase_orders WHERE id=$1`, [id])).rows[0];
    console.log('2) UPDATE   :', JSON.stringify(upd), '(notes set, vendor 99->88)');
    // soft-delete
    await c.query(`UPDATE mm_purchase_orders SET deleted_at=NOW() WHERE id=$1`, [id]);
    const del = (await c.query(`SELECT deleted_at IS NOT NULL AS soft_deleted FROM mm_purchase_orders WHERE id=$1`, [id])).rows[0];
    console.log('3) SOFT-DEL :', JSON.stringify(del));
    await c.query(`DELETE FROM mm_purchase_orders WHERE id=$1`, [id]);
    const rem = (await c.query(`SELECT count(*)::int n FROM mm_purchase_orders WHERE id=$1`, [id])).rows[0].n;
    console.log('4) CLEANUP  : remaining', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM mm_purchase_orders WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
