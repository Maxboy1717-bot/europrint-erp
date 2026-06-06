'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let evalId, movId;
  try {
    // machine_crews SELECT (session_id=0 returns empty - proves table accessible)
    const r1 = await p.query(`SELECT COUNT(*)::int AS cnt FROM machine_crews WHERE session_id = 0`);
    console.log('machine_crews SELECT OK count=', r1.rows[0].cnt);

    // shift_evaluations INSERT
    const r2 = await p.query(
      `INSERT INTO shift_evaluations (eval_id, shift_name, overall_score, skipped, created_at)
       VALUES (9999, 'Proof Session', 0, false, NOW()) RETURNING id`
    );
    evalId = r2.rows[0].id;
    console.log('shift_evaluations INSERT OK id=', evalId);

    // shift_evaluations SELECT
    const r3 = await p.query(`SELECT shift_name, overall_score FROM shift_evaluations WHERE id=$1`, [evalId]);
    console.log('shift_evaluations SELECT OK:', r3.rows[0]);

    // material_movements INSERT (movement_type=RETURN)
    const r4 = await p.query(
      `INSERT INTO material_movements (session_id, movement_type, material_name, quantity, unit, performed_by, created_at)
       VALUES (9999, 'RETURN', 'Proof Material', 5, 'pcs', 0, NOW()) RETURNING id`
    );
    movId = r4.rows[0].id;
    console.log('material_movements INSERT OK id=', movId);

    // material_movements SELECT
    const r5 = await p.query(`SELECT movement_type, material_name, quantity FROM material_movements WHERE id=$1`, [movId]);
    console.log('material_movements SELECT OK:', r5.rows[0]);

    console.log('ALL CHECKS PASSED');
  } finally {
    if (evalId) await p.query('DELETE FROM shift_evaluations WHERE id=$1', [evalId]);
    if (movId) await p.query('DELETE FROM material_movements WHERE id=$1', [movId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
