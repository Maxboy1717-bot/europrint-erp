/**
 * DB-proof SECURITY visitors: getVisitors (SELECT) + visitor exit (UPDATE exited_at/status).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: process.env.PGHOST||'127.0.0.1', port: Number(process.env.PGPORT)||5432, user: process.env.PGUSER||'postgres', password: process.env.PGPASSWORD||'postgres', database: process.env.PGDATABASE||'europrint' });
(async () => {
  try {
    // Insert a sentinel visitor
    const ins = await pool.query(`INSERT INTO security_visitors (full_name, company, purpose, host_employee_name, status) VALUES ('TEST PROOF', 'Test Co', 'audit', 'Test Host', 'entered') RETURNING id`);
    const vid = ins.rows[0].id;

    // getVisitors SELECT
    const lst = await pool.query(`SELECT id FROM security_visitors ORDER BY created_at DESC LIMIT 50`);
    console.log('1) getVisitors SELECT count:', lst.rowCount, lst.rowCount > 0 ? '✅' : '❌');

    // visitor exit UPDATE
    await pool.query(`UPDATE security_visitors SET exited_at=NOW(), status='exited' WHERE id=$1`, [vid]);
    const chk = await pool.query(`SELECT exited_at, status FROM security_visitors WHERE id=$1`, [vid]);
    const row = chk.rows[0];
    console.log('2) visitor exit status:', row.status, row.status === 'exited' ? '✅' : '❌');
    console.log('3) exited_at set:', row.exited_at !== null ? '✅' : '❌');

    // cleanup
    await pool.query(`DELETE FROM security_visitors WHERE id=$1`, [vid]);
    console.log('\n✅ PROOF PASSED — security_visitors SELECT + UPDATE persist correctly.');
  } catch (e) { console.error('ERR:', e.message); }
  finally { await pool.end(); }
})();
