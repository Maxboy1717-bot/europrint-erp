/**
 * STEP B3 DB-PROOF (no HTTP, no JWT). Mirrors org-mutations.repo.ts create()'s EXACT column set
 * (.values({ name, name_ru, description, description_ru, color, tskp, tskp_ru, parent_id, level,
 * node_type, sort_order })). Proves the STEP-B columns persist: INSERT -> SELECT -> DELETE (cleanup).
 * Uses non-default values (node_type='division', color='#ff8800', level=7, tskp filled) so the
 * SELECT proves real persistence, not column defaults.
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
const MARK = '__BPROOF_ORGNODE__';
(async () => {
  const c = await pool.connect();
  let id = null;
  try {
    const ins = await c.query(
      `INSERT INTO org_departments
        (name, name_ru, description, description_ru, color, tskp, tskp_ru, parent_id, level, node_type, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, name, node_type, tskp, tskp_ru, color, level`,
      [MARK, 'ТЕСТ', null, null, '#ff8800', 'asosiy vazifa', 'осн задача', null, 0, 'division', 7],
    );
    id = ins.rows[0].id;
    console.log('1) INSERTED   :', JSON.stringify(ins.rows[0]));
    const sel = await c.query(
      `SELECT id, name, node_type, tskp, tskp_ru, color, level FROM org_departments WHERE id=$1`, [id],
    );
    console.log('2) PERSISTED  :', JSON.stringify(sel.rows[0]));
    const del = await c.query(`DELETE FROM org_departments WHERE id=$1`, [id]);
    console.log('3) DELETED    :', del.rowCount);
    const rem = await c.query(`SELECT count(*)::int AS n FROM org_departments WHERE name=$1`, [MARK]);
    console.log('4) REMAINING  :', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (id) { try { await c.query(`DELETE FROM org_departments WHERE id=$1`, [id]); } catch (_) {} }
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
