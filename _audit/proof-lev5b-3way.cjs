const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    const note = "3-tomonlama moslik buzildi — farq: 1500. Xarid menejer tasdig'i kerak.";
    const ins = await c.query(`INSERT INTO hitl_approvals (entity_type, entity_id, status, requested_by, notes, created_at, updated_at)
      VALUES ('three_way_match','999','pending',NULL,$1,NOW(),NOW()) RETURNING id`, [note]);
    id = ins.rows[0].id;
    console.log('1) INSERTED  : hitl_approvals id', id, '(three_way_match, pending) [auto-id worked]');
    const sel = (await c.query(`SELECT id, entity_type, entity_id, status FROM hitl_approvals WHERE entity_type='three_way_match' AND status='pending' AND entity_id='999'`)).rows;
    console.log('2) MGR SEES  :', sel.length, 'pending match-fail;', JSON.stringify(sel[0]));
    const del = await c.query(`DELETE FROM hitl_approvals WHERE id=$1`, [id]);
    console.log('3) DELETED   :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM hitl_approvals WHERE id=$1`, [id])).rows[0].n;
    console.log('4) REMAINING :', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM hitl_approvals WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
