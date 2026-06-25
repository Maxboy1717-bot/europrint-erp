/** APPLY+DB-PROOF: FAZA-09 karta 5-holat lifecycle. Freeze ustunlar (apply) + holat-o'tish (rollback-tx). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
const VALID = ['active','vacant','io','frozen','archived'];
(async () => {
  const c = await pool.connect();
  try {
    for (const col of ['frozen_at TIMESTAMP','freeze_reason TEXT','freeze_until TIMESTAMP','archived_at TIMESTAMP'])
      await c.query(`ALTER TABLE IF EXISTS org_departments ADD COLUMN IF NOT EXISTS ${col}`);
    console.log(`QO'LLANDI: freeze ustunlar =`, (await c.query(`SELECT count(*) FROM information_schema.columns WHERE table_name='org_departments' AND column_name IN ('frozen_at','freeze_reason','freeze_until','archived_at')`)).rows[0].count, '/4');
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    await c.query('BEGIN');
    // active -> frozen (sabab+muddat)
    await c.query(`UPDATE org_departments SET current_state='frozen', frozen_at=NOW(), freeze_reason='Ta\'tilda', freeze_until=NOW()+INTERVAL '30 days' WHERE id=$1`, [card]);
    const f = (await c.query(`SELECT current_state, freeze_reason FROM org_departments WHERE id=$1`, [card])).rows[0];
    console.log(`1) active -> frozen: state=${f.current_state}, sabab="${f.freeze_reason}" (frozen+sabab kutilgan)`);
    // restore frozen -> active
    await c.query(`UPDATE org_departments SET current_state='active', frozen_at=NULL, freeze_reason=NULL, freeze_until=NULL WHERE id=$1`, [card]);
    const a = (await c.query(`SELECT current_state FROM org_departments WHERE id=$1`, [card])).rows[0];
    console.log(`2) frozen -> restore: state=${a.current_state} (active kutilgan)`);
    console.log(`5-holat enum (app-validatsiya): ${VALID.join('/')}`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> jonli DB tegilmadi');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
