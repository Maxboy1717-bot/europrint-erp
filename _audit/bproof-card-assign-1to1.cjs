/** VISION DB-PROOF (rollback-tx): kartadan xodim boshqarish 1:1.
 *  Repo mantig'ini (assignUser/removeUser) aynan SQL'da takrorlaydi:
 *   1) A->P (bo'sh position-karta) biriktiriladi
 *   2) B->P (band) RAD (1 o'rin = 1 xodim)
 *   3) A->Q ko'chadi (A endi P'da YO'Q — 1 xodim = 1 karta)
 *   4) A->Q olib tashlanadi
 *  Oxirida ROLLBACK — hech narsa qolmaydi. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

async function occupants(c, nodeId, exceptUser) {
  return (await c.query(
    `SELECT user_id FROM employee_org_departments WHERE org_department_id=$1 AND user_id<>$2`,
    [nodeId, exceptUser])).rows;
}
async function assign(c, userId, nodeId) {
  const node = (await c.query(`SELECT node_type FROM org_departments WHERE id=$1`, [nodeId])).rows[0];
  if (!node) return { assigned: false, reason: 'Karta topilmadi' };
  if (node.node_type === 'position') {
    const occ = await occupants(c, nodeId, userId);
    if (occ.length > 0) return { assigned: false, reason: "Karta band — 1 o'rin = 1 xodim" };
  }
  await c.query(`DELETE FROM employee_org_departments WHERE user_id=$1`, [userId]); // 1 xodim=1 karta
  await c.query(`INSERT INTO employee_org_departments (user_id, org_department_id, is_primary) VALUES ($1,$2,true)`, [userId, nodeId]);
  return { assigned: true };
}
async function inNode(c, userId, nodeId) {
  return (await c.query(`SELECT 1 FROM employee_org_departments WHERE user_id=$1 AND org_department_id=$2`, [userId, nodeId])).rows.length > 0;
}

(async () => {
  const c = await pool.connect();
  try {
    const pos = (await c.query(`SELECT id FROM org_departments WHERE node_type='position' AND is_active ORDER BY id LIMIT 2`)).rows;
    const usr = (await c.query(`SELECT id FROM users WHERE is_active ORDER BY id LIMIT 2`)).rows;
    const P = pos[0].id, Q = pos[1].id, A = usr[0].id, B = usr[1].id;
    console.log(`Setup: P(position)=${P}, Q(position)=${Q}, A(user)=${A}, B(user)=${B}`);
    await c.query('BEGIN');
    // toza test uchun P/Q ni bo'shat (tx ichida, rollback bo'ladi)
    await c.query(`DELETE FROM employee_org_departments WHERE org_department_id IN ($1,$2)`, [P, Q]);
    await c.query(`DELETE FROM employee_org_departments WHERE user_id IN ($1,$2)`, [A, B]);

    const r1 = await assign(c, A, P);
    console.log(`1) A->P: ${JSON.stringify(r1)}  | A P'da? ${await inNode(c, A, P)}  (kutilgan: assigned=true, true)`);

    const r2 = await assign(c, B, P);
    console.log(`2) B->P: ${JSON.stringify(r2)}  | B P'da? ${await inNode(c, B, P)}  (kutilgan: assigned=false BAND, false)`);

    const r3 = await assign(c, A, Q);
    console.log(`3) A->Q: ${JSON.stringify(r3)}  | A Q'da? ${await inNode(c, A, Q)}  | A hali P'da? ${await inNode(c, A, P)}  (kutilgan: true, true, FALSE=ko'chdi)`);

    await c.query(`DELETE FROM employee_org_departments WHERE user_id=$1 AND org_department_id=$2`, [A, Q]); // removeUser
    console.log(`4) A->Q olib tashlandi | A Q'da? ${await inNode(c, A, Q)}  (kutilgan: false)`);

    await c.query('ROLLBACK');
    console.log('ROLLBACK bajarildi — hech narsa saqlanmadi.');
  } catch (e) { await c.query('ROLLBACK'); console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
