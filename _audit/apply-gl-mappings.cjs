/**
 * Apply seed-gl-account-mappings-pos.sql to the live DB (idempotent) + verify each mapping
 * resolves to valid CoA accounts. Owner-approved 2026-06-05.
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const sqlFile = path.join(__dirname, '..', 'apps', 'api', 'src', 'shared', 'db', 'migrations', 'seed-gl-account-mappings-pos.sql');

(async () => {
  try {
    await pool.query(fs.readFileSync(sqlFile, 'utf8'));
    const { rows } = await pool.query(`
      SELECT m.transaction_type AS tt, m.debit_account AS da, da.account_name AS dn,
             m.credit_account AS ca, ca2.account_name AS cn
      FROM gl_account_mappings m
      LEFT JOIN accounts da  ON da.account_code  = m.debit_account
      LEFT JOIN accounts ca2 ON ca2.account_code = m.credit_account
      WHERE m.transaction_type IN ('EXTERNAL_IN','EXTERNAL_OUT','INTERNAL_ISSUE','INTERNAL_RETURN','DAMAGE','INVENTORY_ADJ_PLUS')
      ORDER BY m.transaction_type`);
    console.log('--- gl_account_mappings (seeded) ---');
    let allResolve = true;
    for (const r of rows) {
      const ok = r.dn && r.cn;
      if (!ok) allResolve = false;
      console.log(`${ok ? '✅' : '❌'} ${r.tt.padEnd(20)} Dr ${r.da} ${r.dn || 'MISSING'}  |  Cr ${r.ca} ${r.cn || 'MISSING'}`);
    }
    console.log(`\nJami: ${rows.length}/6 mapping, hammasi CoA hisobiga bog'landi: ${allResolve ? 'HA ✅' : 'YO‘Q ❌'}`);
  } catch (e) {
    console.error('SEED ERROR:', e.message);
  } finally {
    await pool.end();
  }
})();
