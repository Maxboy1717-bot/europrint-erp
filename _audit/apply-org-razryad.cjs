/** VISION: add org_departments.razryad_level_id (APPROVED 2026-06-24, every node has razryad). Idempotent. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query('ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER');
    const col = (await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='org_departments' AND column_name='razryad_level_id'`)).rows[0];
    console.log('APPLIED:', JSON.stringify(col));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
