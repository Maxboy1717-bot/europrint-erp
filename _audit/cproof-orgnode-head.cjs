/**
 * STEP C3 DB-PROOF (no HTTP/JWT). Proves head_user_id SAVES and the read path
 * (mirror of org-queries getHierarchyNodes head join, :49) RESOLVES headUserName.
 * Insert temp dept -> set head_user_id to a real active user -> SELECT with users
 * join (name resolves) -> clear head -> DELETE temp dept (cleanup).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const MARK = '__CPROOF_ORGNODE_HEAD__';
(async () => {
  const c = await pool.connect();
  let id = null;
  try {
    const u = (await c.query(
      `SELECT id, first_name, last_name FROM users WHERE is_active = true ORDER BY id LIMIT 1`,
    )).rows[0];
    if (!u) throw new Error('no active user to assign as head');

    const ins = await c.query(
      `INSERT INTO org_departments (name, node_type, level, is_active)
       VALUES ($1, 'department', 0, true) RETURNING id`, [MARK],
    );
    id = ins.rows[0].id;

    await c.query(`UPDATE org_departments SET head_user_id = $1 WHERE id = $2`, [u.id, id]);
    // mirror getHierarchyNodes head join (org-queries.repo.ts:49)
    const sel = (await c.query(
      `SELECT od.id, od.head_user_id,
              (usr.first_name || ' ' || usr.last_name) AS head_user_name
       FROM org_departments od
       LEFT JOIN users usr ON usr.id = od.head_user_id AND usr.is_active = true
       WHERE od.id = $1`, [id],
    )).rows[0];
    console.log('picked user  :', JSON.stringify(u));
    console.log('SAVED+READ   :', JSON.stringify(sel), '(head_user_name must resolve)');

    await c.query(`UPDATE org_departments SET head_user_id = NULL WHERE id = $1`, [id]);
    const cleared = (await c.query(`SELECT head_user_id FROM org_departments WHERE id = $1`, [id])).rows[0];
    console.log('CLEAR head   :', JSON.stringify(cleared), '(must be null)');

    const del = await c.query(`DELETE FROM org_departments WHERE id = $1`, [id]);
    console.log('cleanup del  :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int AS n FROM org_departments WHERE name = $1`, [MARK])).rows[0].n;
    console.log('remaining    :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (id) { try { await c.query(`DELETE FROM org_departments WHERE id = $1`, [id]); } catch (_) {} }
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
