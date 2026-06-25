/** DB-PROOF (rollback-tx): FAZA-04 oylik razryad-koeffi KANONIK kartadan. getRazryadCoefficient SQL'i. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
async function coeff(c, empId) {
  return Number((await c.query(`SELECT COALESCE(rl.coefficient,1.0)::numeric AS coefficient FROM employees e LEFT JOIN employee_org_departments eod ON eod.user_id=e.user_id AND eod.is_active=true LEFT JOIN org_departments od ON od.id=eod.org_department_id LEFT JOIN razryad_levels rl ON rl.id=od.razryad_level_id WHERE e.id=$1 ORDER BY eod.is_primary DESC NULLS LAST LIMIT 1`, [empId])).rows[0]?.coefficient ?? 1);
}
(async () => {
  const c = await pool.connect();
  try {
    const emp = (await c.query(`SELECT e.id, e.user_id FROM employees e WHERE e.user_id IS NOT NULL ORDER BY e.id LIMIT 1`)).rows[0];
    const card = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 1`)).rows[0].id;
    const r3 = (await c.query(`SELECT id, coefficient FROM razryad_levels WHERE level=3`)).rows[0];
    console.log(`emp=${emp.id} (user ${emp.user_id}), card=${card}, 3-razryad coeff=${r3.coefficient}`);
    await c.query('BEGIN');
    console.log(`OLDIN (kartasiz/razryadsiz): coeff=${await coeff(c, emp.id)} (1.0 kutilgan — graceful)`);
    await c.query(`UPDATE org_departments SET razryad_level_id=$1 WHERE id=$2`, [r3.id, card]);
    await c.query(`DELETE FROM employee_org_departments WHERE user_id=$1`, [emp.user_id]);
    await c.query(`INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, is_active, assigned_at, created_at) VALUES ($1,$2,true,true,NOW(),NOW())`, [emp.user_id, card]);
    console.log(`KEYIN  (3-razryadli kartaga ulandi): coeff=${await coeff(c, emp.id)} (${r3.coefficient} kutilgan — KARTADAN)`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> jonli DB tegilmadi');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
