/** APPLY (idempotent, additive APPROVED FAZA-07/Q562): courses.is_universal — cross-card credit gate. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS is_universal BOOLEAN DEFAULT false`);
    const col = (await c.query(`SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='courses' AND column_name='is_universal'`)).rows;
    console.log('QO\'LLANDI: courses.is_universal =', JSON.stringify(col));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
