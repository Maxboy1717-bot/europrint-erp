const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    const ins = await c.query(`INSERT INTO orders_registry (number, category, title, content, issued_by, issued_date, status, department_ids, created_at)
      VALUES ('PROOF-001','buyruq','Proof buyrug''i','matn','2','2026-06-05','draft','[1,2]'::jsonb, NOW()) RETURNING id, title, status, department_ids`);
    id = ins.rows[0].id;
    console.log('1) CREATED  :', JSON.stringify(ins.rows[0]));
    const sel = (await c.query(`SELECT id, title, status, department_ids FROM orders_registry ORDER BY id DESC LIMIT 200`)).rows.find(r=>r.id===id);
    console.log('2) LIST     : test order present:', !!sel, '|', JSON.stringify(sel));
    const del = await c.query(`DELETE FROM orders_registry WHERE id=$1`, [id]);
    console.log('3) CLEANUP  :', del.rowCount, 'deleted');
    const rem = (await c.query(`SELECT count(*)::int n FROM orders_registry WHERE id=$1`, [id])).rows[0].n;
    console.log('4) REMAINING:', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM orders_registry WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
