const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    const ins = await c.query(`INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
      VALUES (999888, 'mes_session', 'pending', 0, 0, 0, NOW(), NOW()) RETURNING id`);
    id = ins.rows[0].id;
    console.log('1) OPENED   : qc_inspection id', id, '(order_id=999888 MES session, status=pending) [auto-id]');
    const sel = (await c.query(`SELECT id, order_id, reference_type, status FROM qc_inspections WHERE reference_type='mes_session' AND status='pending' AND order_id=999888`)).rows;
    console.log('2) QC SEES  :', sel.length, 'pending inspection;', JSON.stringify(sel[0]));
    await c.query(`DELETE FROM qc_inspections WHERE id=$1`, [id]);
    const rem = (await c.query(`SELECT count(*)::int n FROM qc_inspections WHERE id=$1`, [id])).rows[0].n;
    console.log('3) CLEANUP  : remaining', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM qc_inspections WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
