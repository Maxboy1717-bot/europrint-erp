const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  const c = await pool.connect(); let id = null;
  try {
    const ins = await c.query(`INSERT INTO lms_modules (title, course_id, sort_order, created_at) VALUES ('PROOF MODULE', 777, 1, NOW()) RETURNING id`);
    id = ins.rows[0].id;
    console.log('1) INSERTED :', id);
    const sel = (await c.query(`SELECT m.id, m.title, c.title_uz AS course_title FROM lms_modules m LEFT JOIN courses c ON c.id=m.course_id WHERE m.id=$1`, [id])).rows;
    console.log('2) LIST     :', sel.length, 'module(s);', JSON.stringify(sel[0]));
    await c.query(`DELETE FROM lms_modules WHERE id=$1`, [id]);
    const rem = (await c.query(`SELECT count(*)::int n FROM lms_modules WHERE id=$1`, [id])).rows[0].n;
    console.log('3) CLEANUP  : remaining', rem);
  } catch (e) { console.error('ERROR:', e.message); if (id) { try { await c.query(`DELETE FROM lms_modules WHERE id=$1`,[id]); } catch(_){} } process.exitCode=1; }
  finally { c.release(); await pool.end(); }
})();
