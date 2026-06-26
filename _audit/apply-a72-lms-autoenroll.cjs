/**
 * A72 — apply LMS avto-enroll additive schema to the live `europrint` DB.
 * Mirrors the migrations-drift.ts APPROVED block (TO'LQIN-4/A72) so Drizzle-schema (boot
 * ensureSchemaAdditions) and the live DB stay in sync. Idempotent (IF NOT EXISTS).
 * Additive only — no DATA written.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS enrollments ADD COLUMN IF NOT EXISTS card_id INTEGER`);
    await c.query(`ALTER TABLE IF EXISTS enrollments ADD COLUMN IF NOT EXISTS auto_enrolled BOOLEAN NOT NULL DEFAULT false`);
    await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollments_emp_course ON enrollments (employee_id, course_id)`);
    await c.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_card_id ON enrollments (card_id) WHERE card_id IS NOT NULL`);

    const cols = (await c.query(`SELECT count(*) n FROM information_schema.columns WHERE table_name='enrollments' AND column_name IN ('card_id','auto_enrolled')`)).rows[0].n;
    const uq = (await c.query(`SELECT count(*) n FROM pg_indexes WHERE tablename='enrollments' AND indexname='uq_enrollments_emp_course'`)).rows[0].n;
    const ix = (await c.query(`SELECT count(*) n FROM pg_indexes WHERE tablename='enrollments' AND indexname='idx_enrollments_card_id'`)).rows[0].n;
    console.log(`QO'LLANDI: enrollments ustun=${cols}/2, uq_emp_course=${uq}/1, idx_card_id=${ix}/1`);
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
