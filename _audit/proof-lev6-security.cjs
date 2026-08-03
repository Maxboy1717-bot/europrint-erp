const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    // mirror DrizzleIncidentRepository.save (live columns)
    const ins = await c.query(`INSERT INTO security_incidents (type, title, description, severity, status, location, reported_by, created_at, updated_at)
      VALUES ('theft','Proof hodisa','Tavsif','high','open','N/A',0,NOW(),NOW()) RETURNING id`);
    id = ins.rows[0].id;
    console.log('1) SAVED    : security_incidents id', id, '(real persist -> fake-create fixed)');
    const sel = (await c.query(`SELECT id, type, severity, status, location FROM security_incidents WHERE id=$1`, [id])).rows[0];
    console.log('2) READBACK :', JSON.stringify(sel));
    await c.query(`DELETE FROM security_incidents WHERE id=$1`, [id]);
    const rem = (await c.query(`SELECT count(*)::int n FROM security_incidents WHERE id=$1`, [id])).rows[0].n;
    console.log('3) CLEANUP  : remaining', rem, '(must be 0)');
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM security_incidents WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
