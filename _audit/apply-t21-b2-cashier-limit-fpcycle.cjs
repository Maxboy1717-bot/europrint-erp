/**
 * Apply t21-b2-cashier-limit-fpcycle-2026-06-26.sql (idempotent, additive) + verify.
 * APPROVED: egasi "hamma vizyon" 2026-06-26.
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
const sqlFile = path.join(__dirname, '..', 'apps', 'api', 'src', 'shared', 'db', 'migrations', 't21-b2-cashier-limit-fpcycle-2026-06-26.sql');
(async () => {
  try {
    await pool.query(fs.readFileSync(sqlFile, 'utf8'));
    const col = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='cashier_shifts' AND column_name='daily_cash_limit'`);
    console.log('cashier_shifts.daily_cash_limit:', JSON.stringify(col.rows));
    const cfg = await pool.query(`SELECT config_key, config_value FROM cfo_config WHERE config_key IN ('payroll_inps_rate','payroll_jshd_rate','payroll_employer_social_rate','cashier_daily_cash_limit_uzs') ORDER BY config_key`);
    console.log('FP-cycle cfo_config seeded:');
    for (const r of cfg.rows) console.log(`  ${r.config_key} = ${r.config_value}`);
  } catch (e) {
    console.error('MIGRATION ERROR:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
