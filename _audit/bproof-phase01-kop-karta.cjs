/** DB-PROOF (rollback-tx): FAZA-01 ko'p-karta + ulush-cap. assignUser mantig'ini SQL'da takrorlaydi. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
async function assign(c, userId, nodeId, stake, override) {
  if (stake != null) {
    const tot = Number((await c.query(`SELECT COALESCE(SUM(stake_fraction),0)::numeric t FROM employee_org_departments WHERE user_id=$1 AND is_active=true AND org_department_id<>$2`, [userId, nodeId])).rows[0].t);
    if (tot + stake > 1.0 && !override) return { assigned: false, reason: `ulush ${(tot+stake).toFixed(2)}>1.0 RAD` };
  }
  const dup = (await c.query(`SELECT id FROM employee_org_departments WHERE user_id=$1 AND org_department_id=$2 AND is_active=true LIMIT 1`, [userId, nodeId])).rows;
  if (dup[0]) await c.query(`UPDATE employee_org_departments SET stake_fraction=$1 WHERE id=$2`, [stake, dup[0].id]);
  else await c.query(`INSERT INTO employee_org_departments (user_id, org_department_id, is_primary, is_active, stake_fraction, assigned_at, created_at) VALUES ($1,$2,true,true,$3,NOW(),NOW())`, [userId, nodeId, stake]);
  return { assigned: true };
}
(async () => {
  const c = await pool.connect();
  try {
    const u = (await c.query(`SELECT id FROM users WHERE is_active ORDER BY id LIMIT 1`)).rows[0].id;
    const d = (await c.query(`SELECT id FROM org_departments WHERE node_type='department' AND is_active ORDER BY id LIMIT 2`)).rows;
    const D1 = d[0].id, D2 = d[1].id;
    console.log(`user=${u}, D1=${D1}, D2=${D2}`);
    await c.query('BEGIN');
    await c.query(`DELETE FROM employee_org_departments WHERE user_id=$1`, [u]);
    console.log('1) A->D1 (0.6):', JSON.stringify(await assign(c, u, D1, 0.6, false)));
    console.log('2) A->D2 (0.6, override=false):', JSON.stringify(await assign(c, u, D2, 0.6, false)), '(RAD kutilgan)');
    console.log('3) A->D2 (0.6, override=true):', JSON.stringify(await assign(c, u, D2, 0.6, true)), '(RUXSAT kutilgan)');
    const n = (await c.query(`SELECT count(*)::int n, SUM(stake_fraction)::numeric s FROM employee_org_departments WHERE user_id=$1 AND is_active=true`, [u])).rows[0];
    console.log(`Natija: A ${n.n} aktiv kartada, ulush-yig'indi=${n.s} (2 karta, 1.20 kutilgan — override bilan)`);
    await c.query('ROLLBACK');
    console.log('ROLLBACK -> jonli DB tegilmadi');
  } catch (e) { try { await c.query('ROLLBACK'); } catch {} console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
