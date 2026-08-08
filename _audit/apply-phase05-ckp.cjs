const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS ckp_formula_type TEXT`);
    await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS ckp_frequency TEXT`);
    await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS ckp_report_deadline_hours INTEGER`);
    await c.query(`CREATE TABLE IF NOT EXISTS ckp_fact_values (id SERIAL PRIMARY KEY, card_id INTEGER NOT NULL, employee_id INTEGER, product_id INTEGER, fact_date DATE NOT NULL, target_value NUMERIC(14,3), actual_value NUMERIC(14,3), achievement_pct NUMERIC(6,2), source TEXT NOT NULL DEFAULT 'MANUAL', formula_type TEXT, status TEXT NOT NULL DEFAULT 'submitted', submitted_at TIMESTAMP, notes TEXT, recorded_by INTEGER, created_at TIMESTAMP NOT NULL DEFAULT NOW())`);
    await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_ckp_fact_card_day ON ckp_fact_values (card_id, fact_date, COALESCE(employee_id,0), COALESCE(product_id,0))`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_ckp_fact_card_date ON ckp_fact_values (card_id, fact_date DESC)`);
    const r = (await c.query(`SELECT to_regclass('public.ckp_fact_values') t, (SELECT count(*) FROM information_schema.columns WHERE table_name='org_departments' AND column_name IN ('ckp_formula_type','ckp_frequency','ckp_report_deadline_hours')) meta`)).rows[0];
    console.log(`QO'LLANDI: ckp_fact_values=${r.t}, meta-ustun=${r.meta}/3`);
  } catch (e) { console.error('ERR', e.message); } finally { c.release(); await pool.end(); }
})();
