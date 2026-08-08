/** Egasi 2026-06-24: 2 ta test node (P04 Unit Test, id 165/166) — 0 bog'lanish — soft-delete (is_active=false). Qaytariladigan. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    // safety re-check: only soft-delete if 0 children + 0 employees + test name
    const before = (await c.query(`
      SELECT od.id, od.name,
        (SELECT COUNT(*) FROM org_departments ch WHERE ch.parent_id=od.id AND ch.is_active) AS children,
        (SELECT COUNT(*) FROM employee_org_departments e WHERE e.org_department_id=od.id) AS emps
      FROM org_departments od WHERE od.id IN (165,166)`)).rows;
    console.log('TARGETS:', JSON.stringify(before));
    const safe = before.every(r => Number(r.children) === 0 && Number(r.emps) === 0 && /test/i.test(r.name));
    if (!safe) { console.log('ABORT: not all targets are empty test nodes'); await pool.end(); return; }
    const r = await c.query(`UPDATE org_departments SET is_active=false WHERE id IN (165,166) AND is_active=true RETURNING id, name`);
    console.log('SOFT-DELETED:', r.rowCount, JSON.stringify(r.rows));
    const roots = (await c.query(`SELECT COUNT(*)::int AS n FROM org_departments WHERE is_active=true AND parent_id IS NULL`)).rows[0].n;
    const total = (await c.query(`SELECT COUNT(*)::int AS n FROM org_departments WHERE is_active=true`)).rows[0].n;
    console.log('AFTER: active nodes =', total, '| roots =', roots);
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
