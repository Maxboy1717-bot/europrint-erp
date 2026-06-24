/** VISION DB-PROOF (rollback-tx). razryad coefficient editability (org-brain razryad-data config). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const before = (await c.query(`SELECT coefficient FROM razryad_levels WHERE level=2`)).rows[0];
    await c.query(`UPDATE razryad_levels SET coefficient=COALESCE($1,coefficient), updated_at=NOW() WHERE id=6 AND is_active=true`, [1.40]);
    const after = (await c.query(`SELECT coefficient FROM razryad_levels WHERE level=2`)).rows[0];
    console.log('coefficient:', before.coefficient, '->', after.coefficient, '(PATCH ishladi)');
    await c.query('ROLLBACK');
    const rb = (await c.query(`SELECT coefficient FROM razryad_levels WHERE level=2`)).rows[0];
    console.log('ROLLBACK ->', rb.coefficient, '(unchanged:', rb.coefficient === before.coefficient, ')');
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
