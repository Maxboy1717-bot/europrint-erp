/**
 * VISION DB-PROOF (rollback-tx). Card manager-setter (Vysotskiy 7 vertical chain).
 * manager_id was read (Farzandlar tab) but never SET — no way to configure the vertical hierarchy.
 * Proof: set card A's manager = B → A appears in B's children; cycle (B's manager = A) rejected;
 *        ROLLBACK leaves manager_id unchanged.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
async function isDescendant(c, rootId, candidateId) {
  const r = await c.query(
    `WITH RECURSIVE d AS (SELECT id FROM org_functions WHERE id=$1
       UNION ALL SELECT f.id FROM org_functions f JOIN d ON f.manager_id=d.id)
     SELECT 1 FROM d WHERE id=$2 LIMIT 1`, [rootId, candidateId]);
  return r.rows.length > 0;
}
(async () => {
  const c = await pool.connect();
  try {
    const cards = (await c.query(`SELECT id, position_name, manager_id FROM org_functions WHERE deleted_at IS NULL ORDER BY id LIMIT 2`)).rows;
    const A = cards[0], B = cards[1];
    console.log('0) A =', A.id, `(${A.position_name}, manager=${A.manager_id})`, '| B =', B.id, `(${B.position_name})`);

    await c.query('BEGIN');
    // set A.manager = B (cycle guard: B must not be a descendant of A)
    const cyc1 = await isDescendant(c, A.id, B.id);
    console.log('1) cycle-guard (B descendant of A?)', cyc1, '→', cyc1 ? 'REJECT' : 'allow');
    if (!cyc1) {
      await c.query(`UPDATE org_functions SET manager_id=$1, updated_at=now() WHERE id=$2`, [B.id, A.id]);
    }
    const childrenOfB = await c.query(`SELECT id, position_name FROM org_functions WHERE manager_id=$1 AND deleted_at IS NULL`, [B.id]);
    console.log('2) B children now:', JSON.stringify(childrenOfB.rows), '→ A present:', childrenOfB.rows.some(r => r.id === A.id));

    // try cycle: B.manager = A (A is now manager of B → A is ancestor; setting B.manager=A is fine,
    // but setting A.manager=B already done; now try B.manager=A which would create A<->B cycle)
    const cyc2 = await isDescendant(c, B.id, A.id); // is A a descendant of B? (A.manager=B so yes)
    console.log('3) cycle-guard for B.manager=A (A descendant of B?)', cyc2, '→', cyc2 ? 'REJECT (correct)' : 'allow');

    await c.query('ROLLBACK');
    const after = (await c.query(`SELECT manager_id FROM org_functions WHERE id=$1`, [A.id])).rows[0];
    console.log('4) ROLLBACK → A.manager_id =', after.manager_id, '(unchanged:', after.manager_id === A.manager_id, ')');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally { c.release(); await pool.end(); }
})();
