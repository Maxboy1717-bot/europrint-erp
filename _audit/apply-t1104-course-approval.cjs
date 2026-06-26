/** APPLY (idempotent, additive APPROVED T11-04): courses 3-bosqich tasdiq workflow ustunlari. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
const stmts = [
  `ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'draft'`,
  `ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS submitted_by INTEGER`,
  `ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,
  `ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS approved_by INTEGER`,
  `ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_courses_approval_status') THEN ALTER TABLE courses ADD CONSTRAINT chk_courses_approval_status CHECK (approval_status IN ('draft','review','approved')); END IF; END $$`,
];
(async () => {
  const c = await pool.connect();
  try {
    for (const s of stmts) { await c.query(s); }
    const cols = (await c.query(`SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name='courses' AND column_name IN ('approval_status','submitted_by','submitted_at','approved_by','approved_at') ORDER BY column_name`)).rows;
    console.log('QO\'LLANDI ustunlar:', JSON.stringify(cols, null, 2));
    const chk = (await c.query(`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname='chk_courses_approval_status'`)).rows;
    console.log('CHECK:', JSON.stringify(chk, null, 2));
    const dist = (await c.query(`SELECT approval_status, count(*)::int n FROM courses GROUP BY approval_status`)).rows;
    console.log('approval_status taqsimot:', JSON.stringify(dist));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
