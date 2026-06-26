/** APPROVED: egasi 'hamma vizyon' 2026-06-26. Gap #15 (T20-B1) error_catalog -> CKP link.
 *  Additive + idempotent: ckp_fact_values.error_code (TEXT) + partial index. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS ckp_fact_values ADD COLUMN IF NOT EXISTS error_code TEXT`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_ckp_fact_values_error_code ON ckp_fact_values (error_code) WHERE error_code IS NOT NULL`);
    const col = (await c.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='ckp_fact_values' AND column_name='error_code'`)).rows;
    const idx = (await c.query(`SELECT indexname FROM pg_indexes WHERE tablename='ckp_fact_values' AND indexname='idx_ckp_fact_values_error_code'`)).rows;
    console.log('APPLIED ckp_fact_values.error_code:', JSON.stringify(col), 'idx:', JSON.stringify(idx));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
