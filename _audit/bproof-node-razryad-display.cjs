/** DB-PROOF (rollback-tx): kartaga razryad+maydon tayinlanganda node-detal javobi TO'LIQ qaytaradimi
 *  (MainTab aynan shuni render qiladi). DATA SAQLANMAYDI — tx ROLLBACK. Egasi "razyadlar qani" — bu
 *  ko'rsatish-mantig'i to'g'ri ishlashini isbotlaydi (fabrikatsiya YO'Q). */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const node = (await c.query(`SELECT id, name FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0];
    const rz = (await c.query(`SELECT id, level, name, coefficient, salary_min, salary_max, min_requirement, min_months FROM razryad_levels WHERE level=3`)).rows[0];
    console.log(`Test karta: #${node.id} "${node.name}"; tayinlanadigan razryad: ${rz.name} (koeff ${rz.coefficient})`);
    await c.query('BEGIN');
    await c.query(
      `UPDATE org_departments SET razryad_level_id=$1, salary_type='oylik', min_salary=5500000, max_salary=7000000,
        rbac_tier='operator', tskp_target=90, tskp_measurement_unit='FOIZ', work_schedule='09:00-18:00',
        bonus_config='reja oshsa 10%', current_state='faol' WHERE id=$2`, [rz.id, node.id]);
    // node-detal SELECT (org-queries.repo MainTab uchun qaytaradigan maydonlar)
    const d = (await c.query(
      `SELECT id, razryad_level_id, salary_type, min_salary, max_salary, rbac_tier, tskp_target,
        tskp_measurement_unit, work_schedule, bonus_config, current_state FROM org_departments WHERE id=$1`, [node.id])).rows[0];
    console.log('\nNODE-DETAL javobi (MainTab "Karta ta\'rifi" shuni ko\'rsatadi):');
    console.log(JSON.stringify(d, null, 2));
    // razryad_levels JOIN (MainTab koeff/oylik-diapazon/talab uchun):
    const r = (await c.query(`SELECT name, coefficient, salary_min, salary_max, min_requirement, min_months FROM razryad_levels WHERE id=$1`, [d.razryad_level_id])).rows[0];
    console.log('\nrazryad_levels JOIN (razryad bloki):', JSON.stringify(r));
    await c.query('ROLLBACK');
    const after = (await c.query(`SELECT razryad_level_id FROM org_departments WHERE id=$1`, [node.id])).rows[0];
    console.log(`\nROLLBACK -> karta #${node.id} razryad_level_id = ${after.razryad_level_id} (NULL = saqlanmadi, 0 dan)`);
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
