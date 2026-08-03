/**
 * A6 DB-PROOF: cfo_config write (the path POST -> cfoConfig.update -> repo.upsertCfoConfig).
 * Insert a test config entry -> SELECT (persisted?) -> DELETE -> report.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432), user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres', database: process.env.PGDATABASE || 'europrint' });
const KEY = '__A6_PROOF_KEY__';
(async () => {
  const c = await pool.connect();
  try {
    const ins = await c.query(
      `INSERT INTO cfo_config (config_key, config_value, description, updated_at)
       VALUES ($1, $2, 'A6 proof', NOW()) RETURNING id, config_key, config_value`, [KEY, '0.123456']);
    console.log('1) INSERTED   :', JSON.stringify(ins.rows[0]));
    const sel = (await c.query(`SELECT config_key, config_value FROM cfo_config WHERE config_key=$1`, [KEY])).rows[0];
    console.log('2) PERSISTED  :', JSON.stringify(sel), '(config_value must be 0.123456)');
    const del = await c.query(`DELETE FROM cfo_config WHERE config_key=$1`, [KEY]);
    console.log('3) DELETED    :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM cfo_config WHERE config_key=$1`, [KEY])).rows[0].n;
    console.log('4) REMAINING  :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    try { await c.query(`DELETE FROM cfo_config WHERE config_key=$1`, [KEY]); } catch (_) {}
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
