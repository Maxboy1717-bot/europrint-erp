/** VISION DB-PROOF (rollback-tx): HR node=karta YARATISH (create) — barcha karta-maydoni bilan. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const rz = (await c.query(`SELECT id FROM razryad_levels ORDER BY level LIMIT 1`)).rows[0];
    await c.query('BEGIN');
    const ins = (await c.query(
      `INSERT INTO org_departments (name, name_ru, node_type, parent_id, is_active, created_at)
       VALUES ($1,$2,$3,$4,true,now()) RETURNING id`,
      ['TEST Yangi Lavozim', 'ТЕСТ', 'position', 20])).rows[0];
    await c.query(
      `UPDATE org_departments SET razryad_level_id=$1, salary_type='oylik', min_salary=4000000, max_salary=6000000,
        rbac_tier='operator', tskp_target=95, tskp_measurement_unit='FOIZ', work_schedule='08:00-17:00',
        current_state='faol', bonus_config='reja oshsa 10%' WHERE id=$2`, [rz.id, ins.id]);
    const r = (await c.query(
      `SELECT id,name,node_type,parent_id,razryad_level_id,salary_type,min_salary,max_salary,rbac_tier,tskp_target,work_schedule,bonus_config
       FROM org_departments WHERE id=$1`, [ins.id])).rows[0];
    console.log('YARATILGAN node=karta:', JSON.stringify(r));
    await c.query('ROLLBACK');
    const rem = (await c.query(`SELECT count(*)::int n FROM org_departments WHERE name='TEST Yangi Lavozim'`)).rows[0].n;
    console.log('ROLLBACK -> qoldi:', rem, "(0 bo'lishi kerak)");
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
