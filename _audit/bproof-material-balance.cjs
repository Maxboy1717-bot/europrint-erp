/**
 * iter-76 DB-PROOF (rollback-tx). material-balance/production endpoint repair.
 * BUG: repo getProduction SELECT + productionAction INSERT referenced columns that DO NOT EXIST
 *      on production_material_balance (material_card_id/production_order_id/action_type/quantity)
 *      → 42703; material_id/material_name (NOT NULL) never written → 23502. GET+POST both dead.
 * Proof: run the FIXED INSERT...SELECT (material lookup) for take/use/return, then the FIXED
 *        getProduction SELECT, confirm rows visible, ROLLBACK → count 0.
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
(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const mat = (await c.query(`SELECT id, xom_ashyo FROM material_cards WHERE xom_ashyo IS NOT NULL ORDER BY id LIMIT 1`)).rows[0];
    console.log('0) material =', mat ? `${mat.id} (${mat.xom_ashyo})` : 'NONE');

    for (const [action, qty] of [['take', 100], ['use', 60], ['return', 15]]) {
      const ins = await c.query(
        `INSERT INTO production_material_balance
           (material_id, material_name, unit, action, taken_qty, used_qty, returned_qty, notes, papka_order_id, operator_id, created_at)
         SELECT mc.id, mc.xom_ashyo, COALESCE(mc.unit_of_measure,'dona'), $1::text,
                CASE WHEN $1::text='take' THEN $2::numeric ELSE 0 END,
                CASE WHEN $1::text='use'  THEN $2::numeric ELSE 0 END,
                CASE WHEN $1::text='return' THEN $2::numeric ELSE 0 END,
                'ITER76 proof', NULL, NULL, NOW()
         FROM material_cards mc WHERE mc.id = $3
         RETURNING id, material_id, material_name, action, taken_qty, used_qty, returned_qty`,
        [action, qty, mat.id],
      );
      console.log(`1.${action} INSERT :`, JSON.stringify(ins.rows[0]));
    }

    // FIXED getProduction SELECT
    const sel = await c.query(`
      SELECT pmb.id, pmb.material_id, pmb.material_name, pmb.action,
             pmb.taken_qty, pmb.used_qty, pmb.returned_qty, pmb.unit, mc.current_stock
      FROM production_material_balance pmb
      LEFT JOIN material_cards mc ON mc.id = pmb.material_id
      WHERE pmb.notes = 'ITER76 proof'
      ORDER BY pmb.created_at DESC`);
    console.log('2) getProduction returns', sel.rows.length, 'rows:', JSON.stringify(sel.rows));

    await c.query('ROLLBACK');
    const rem = await c.query(`SELECT count(*)::int AS n FROM production_material_balance WHERE notes='ITER76 proof'`);
    console.log('3) ROLLBACK → remaining =', rem.rows[0].n, '(must be 0)');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
