/** VISION (egasi 2026-06-24): node=karta. org_functions karta-maydonlarini org_departments'ga (additive, idempotent). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
const COLS = [
  ['salary_type', 'TEXT'], ['min_salary', 'NUMERIC'], ['max_salary', 'NUMERIC'],
  ['rbac_tier', 'TEXT'], ['ai_exam_enabled', 'BOOLEAN'], ['statistics_type', 'TEXT'],
  ['tskp_target', 'INTEGER'], ['tskp_measurement_unit', 'VARCHAR'], ['last_reviewed_at', 'TIMESTAMP'],
  ['work_schedule', 'TEXT'], ['current_state', 'TEXT'], ['bonus_config', 'TEXT'],
];
(async () => {
  const c = await pool.connect();
  try {
    for (const [col, type] of COLS) {
      await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    }
    const have = (await c.query(`SELECT string_agg(column_name, ', ' ORDER BY column_name) AS cols FROM information_schema.columns WHERE table_name='org_departments' AND column_name = ANY($1)`, [COLS.map(c => c[0])])).rows[0].cols;
    console.log('APPLIED node=card cols on org_departments:', have);
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
