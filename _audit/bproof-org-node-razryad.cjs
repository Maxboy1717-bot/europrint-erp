/**
 * VISION DB-PROOF (rollback-tx). org_departments node razryad.
 * Vizyon: har node (bo'lim VA lavozim/position) razryadga ega. razryad_level_id qo'shildi.
 * Proof: position-node ga razryad set -> node-detail SELECT (raw razryad_level_id) ko'rsatadi -> ROLLBACK.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const node = (await c.query(`SELECT id, name, node_type FROM org_departments WHERE node_type='position' AND is_active=true ORDER BY id LIMIT 1`)).rows[0];
    const rz = (await c.query(`SELECT id, level, name, coefficient FROM razryad_levels ORDER BY level LIMIT 1`)).rows[0];
    console.log('0) position node =', node.id, `(${node.name})`, '| razryad =', rz.id, `(${rz.name}, ×${rz.coefficient})`);

    await c.query('BEGIN');
    await c.query(`UPDATE org_departments SET razryad_level_id=$1 WHERE id=$2`, [rz.id, node.id]);
    // node-detail SELECT (raw razryad_level_id + join razryad name/coeff)
    const sel = await c.query(
      `SELECT od.id, od.name, od.node_type, od.razryad_level_id, rl.name AS razryad_name, rl.coefficient
       FROM org_departments od LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
       WHERE od.id=$1`, [node.id]);
    console.log('1) SET+SELECT :', JSON.stringify(sel.rows[0]));
    await c.query('ROLLBACK');
    const after = (await c.query(`SELECT razryad_level_id FROM org_departments WHERE id=$1`, [node.id])).rows[0];
    console.log('2) ROLLBACK -> razryad_level_id =', after.razryad_level_id, '(unchanged null:', after.razryad_level_id === null, ')');
  } catch (e) { try { await c.query('ROLLBACK'); } catch (_) {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
