/**
 * DB-proof: CC MANAGER_OF_SENDER tree-walk fallback. employees.manager_id is 0/30 NULL, so the direct
 * path fails; the fallback walks UP org_departments.parent_id to the nearest head_user_id.
 * Scenario: parent dept (head=H) -> child dept (no head) -> sender in child. Expect resolve = H.
 * Replicates the recursive-CTE from cc-org-resolver.service. Temp rows; cleaned up.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const SENDER = 990888, HEAD = 990889;
const WALK = (uid) => `
  WITH RECURSIVE chain AS (
    SELECT od.id, od.parent_id, od.head_user_id, 0 AS depth
    FROM employee_org_departments eod JOIN org_departments od ON od.id = eod.org_department_id
    WHERE eod.user_id = ${uid} AND eod.is_primary = true
    UNION ALL
    SELECT p.id, p.parent_id, p.head_user_id, c.depth + 1
    FROM chain c JOIN org_departments p ON p.id = c.parent_id WHERE c.depth < 20
  )
  SELECT head_user_id FROM chain WHERE head_user_id IS NOT NULL AND head_user_id <> ${uid} ORDER BY depth LIMIT 1`;

(async () => {
  let parentId, childId;
  try {
    parentId = (await pool.query(`INSERT INTO org_departments (name, head_user_id) VALUES ('__P_PARENT__', $1) RETURNING id`, [HEAD])).rows[0].id;
    childId = (await pool.query(`INSERT INTO org_departments (name, parent_id, head_user_id) VALUES ('__P_CHILD__', $1, NULL) RETURNING id`, [parentId])).rows[0].id;
    await pool.query(`INSERT INTO employee_org_departments (user_id, org_department_id, is_primary) VALUES ($1, $2, true)`, [SENDER, childId]);

    const resolved = (await pool.query(WALK(SENDER))).rows[0];
    const ok = resolved && Number(resolved.head_user_id) === HEAD;
    console.log('--- DB-PROOF: CC MANAGER_OF_SENDER tree-walk ---');
    console.log('sender in child dept (no head) -> walk up -> manager =', resolved ? resolved.head_user_id : 'NONE',
      ok ? `✅ (parent dept head ${HEAD})` : '❌');

    await pool.query(`DELETE FROM employee_org_departments WHERE user_id=$1`, [SENDER]);
    await pool.query(`DELETE FROM org_departments WHERE id IN ($1,$2)`, [childId, parentId]);
    const left = (await pool.query(`SELECT COUNT(*)::int n FROM org_departments WHERE id IN ($1,$2)`, [childId, parentId])).rows[0].n;
    console.log('cleanup remaining :', left, left === 0 ? '✅' : '❌');

    console.log(ok && left === 0
      ? '\n✅ PROOF PASSED — MANAGER_OF_SENDER resolves via org-tree ancestor head (no manager_id data needed).'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { await pool.query(`DELETE FROM employee_org_departments WHERE user_id=$1`, [SENDER]); if (childId) await pool.query(`DELETE FROM org_departments WHERE id=$1`, [childId]); if (parentId) await pool.query(`DELETE FROM org_departments WHERE id=$1`, [parentId]); } catch {}
  } finally { await pool.end(); }
})();
