const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS salary_history ADD COLUMN IF NOT EXISTS razryad_coefficient NUMERIC(5,2)`);
    await c.query(`ALTER TABLE IF EXISTS salary_history ADD COLUMN IF NOT EXISTS stake_total NUMERIC(4,3)`);
    await c.query(`ALTER TABLE IF EXISTS salary_history ADD COLUMN IF NOT EXISTS proration_days INTEGER`);
    const n = (await c.query(`SELECT string_agg(column_name,',') c FROM information_schema.columns WHERE table_name='salary_history' AND column_name IN ('razryad_coefficient','stake_total','proration_days')`)).rows[0].c;
    console.log('QO\'LLANDI: salary_history audit ustunlari =', n);
  } catch (e) { console.error('ERR', e.message); } finally { c.release(); await pool.end(); }
})();
