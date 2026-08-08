const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE employee_org_departments ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true, ADD COLUMN IF NOT EXISTS stake_fraction numeric(4,3), ADD COLUMN IF NOT EXISTS frozen_at timestamptz, ADD COLUMN IF NOT EXISTS freeze_reason text, ADD COLUMN IF NOT EXISTS freeze_until timestamptz, ADD COLUMN IF NOT EXISTS ended_at timestamptz`);
    await c.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_eod_stake_range') THEN ALTER TABLE employee_org_departments ADD CONSTRAINT chk_eod_stake_range CHECK (stake_fraction IS NULL OR (stake_fraction >= 0 AND stake_fraction <= 1)); END IF; END $$`);
    await c.query(`CREATE INDEX IF NOT EXISTS ix_eod_user_active ON employee_org_departments (user_id) WHERE is_active = true`);
    await c.query(`CREATE INDEX IF NOT EXISTS ix_eod_node_active ON employee_org_departments (org_department_id) WHERE is_active = true`);
    await c.query(`UPDATE employee_org_departments eod SET stake_fraction = 1.0 WHERE stake_fraction IS NULL AND is_active = true AND (SELECT COUNT(*) FROM employee_org_departments x WHERE x.user_id = eod.user_id AND x.is_active = true) = 1`);
    const cols = (await c.query(`SELECT count(*) n FROM information_schema.columns WHERE table_name='employee_org_departments' AND column_name IN ('is_active','stake_fraction','frozen_at','freeze_reason','freeze_until','ended_at')`)).rows[0].n;
    const chk = (await c.query(`SELECT count(*) n FROM pg_constraint WHERE conname='chk_eod_stake_range'`)).rows[0].n;
    const bf = (await c.query(`SELECT count(*) FILTER (WHERE stake_fraction=1.0) solo, count(*) FILTER (WHERE stake_fraction IS NULL) multi FROM employee_org_departments WHERE is_active`)).rows[0];
    console.log(`QO'LLANDI: ustun=${cols}/6, CHECK=${chk}/1, backfill solo(1.0)=${bf.solo} multi(NULL)=${bf.multi}`);
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
