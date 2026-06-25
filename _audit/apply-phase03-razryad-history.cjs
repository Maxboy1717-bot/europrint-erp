const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS razryad_history (id SERIAL PRIMARY KEY, card_id INTEGER NOT NULL, employee_id INTEGER, old_razryad_id INTEGER, new_razryad_id INTEGER NOT NULL, change_type TEXT NOT NULL, reason TEXT, exam_score NUMERIC(5,2), certificate_number TEXT, requested_by INTEGER, hr_approved_by INTEGER, manager_approved_by INTEGER, ai_suggested BOOLEAN NOT NULL DEFAULT false, effective_at TIMESTAMP NOT NULL DEFAULT NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW())`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_razryad_history_card ON razryad_history (card_id, effective_at DESC)`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_razryad_history_emp ON razryad_history (employee_id)`);
    await c.query(`CREATE TABLE IF NOT EXISTS razryad_requests (id SERIAL PRIMARY KEY, card_id INTEGER NOT NULL, employee_id INTEGER, target_razryad_id INTEGER NOT NULL, current_razryad_id INTEGER, request_type TEXT NOT NULL, exam_score NUMERIC(5,2), reason TEXT, status TEXT NOT NULL DEFAULT 'pending', hr_approved_by INTEGER, hr_approved_at TIMESTAMP, manager_approved_by INTEGER, manager_approved_at TIMESTAMP, rejected_by INTEGER, reject_reason TEXT, requested_by INTEGER, ai_suggested BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW())`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_razryad_requests_card ON razryad_requests (card_id, status)`);
    await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS next_attestation_date DATE`);
    const r = (await c.query(`SELECT to_regclass('public.razryad_history') h, to_regclass('public.razryad_requests') rq, (SELECT count(*) FROM information_schema.columns WHERE table_name='org_departments' AND column_name='next_attestation_date') nad`)).rows[0];
    console.log(`QO'LLANDI: razryad_history=${r.h}, razryad_requests=${r.rq}, next_attestation_date=${r.nad}/1`);
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
