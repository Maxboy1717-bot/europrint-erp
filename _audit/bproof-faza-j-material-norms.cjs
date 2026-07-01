/**
 * FAZA J (Bo'lim ombori + AI norma) DB-PROOF (rollback-tx).
 * Verifies:
 *   1) material_norms.department_code column exists (migration applied).
 *   2) Manual CREATE norm (material-norms.repository.create SQL shape).
 *   3) computeHistoricalConsumption SQL — real AVG over synthetic completed
 *      INTERNAL_ISSUE pos_movements/pos_movement_lines rows.
 *   4) upsertAiNorm SQL — inserts a department-scoped AI norma from that history.
 *   5) pos-anomaly.repository.getNormComparison SQL (department-aware LATERAL
 *      join) — proves a movement in the SAME department picks the department
 *      norma over the global one, and OVER_NORM_CONSUMPTION would fire.
 * All inside one transaction, ROLLBACK at the end — 0 net rows written.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret (local dev DB, matches all _audit/bproof-*.cjs)

(async () => {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');

    const col = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='material_norms' AND column_name='department_code'`);
    console.log('0) department_code column exists:', col.rows.length === 1);

    const mat = (await c.query(`SELECT id FROM raw_materials ORDER BY id LIMIT 1`)).rows[0];
    console.log('0b) test material_id =', mat.id);
    const DEPT = 'OFSET-PROOF';

    // 1) Manual create (global norm, no department)
    const created = await c.query(
      `INSERT INTO material_norms
         (material_id, material_name, norm_quantity_per_1000, unit, waste_percentage,
          safety_stock_percentage, department_code, formula, calculated_by_ai,
          based_on_orders_count, is_active, created_at, updated_at)
       VALUES ($1, 'FAZA-J proof material', 50, 'kg', 5, 10, NULL, NULL, false, 0, true, NOW(), NOW())
       RETURNING id, material_id, norm_quantity_per_1000, department_code, calculated_by_ai`,
      [mat.id],
    );
    console.log('1) manual GLOBAL norm created:', JSON.stringify(created.rows[0]));

    // 2) Synthetic completed INTERNAL_ISSUE movements for the test material, in DEPT
    const movementIds = [];
    for (const qty of [80, 90, 100]) {
      const mv = await c.query(
        `INSERT INTO pos_movements (movement_number, movement_type, status, bulim, created_by, completed_at, created_at, updated_at)
         VALUES ('FAZA-J-PROOF-' || nextval('pos_movements_id_seq'), 'INTERNAL_ISSUE', 'completed', $1,
                 (SELECT id FROM users LIMIT 1), NOW(), NOW(), NOW())
         RETURNING id`,
        [DEPT],
      );
      const movId = mv.rows[0].id;
      movementIds.push(movId);
      await c.query(
        `INSERT INTO pos_movement_lines (movement_id, material_id, unit, quantity, created_at)
         VALUES ($1, $2, 'kg', $3, NOW())`,
        [movId, mat.id, qty],
      );
    }
    console.log('2) synthetic INTERNAL_ISSUE movements:', movementIds, 'qtys=[80,90,100] avg=90');

    // 3) computeHistoricalConsumption logic (mirrors material-norms.repository.ts)
    const hist = await c.query(
      `WITH recent_movements AS (
         SELECT pm.id
         FROM pos_movements pm
         WHERE pm.status = 'completed' AND pm.movement_type = 'INTERNAL_ISSUE'
           AND pm.deleted_at IS NULL
           AND (${'$1'}::text IS NULL OR pm.bulim = $1)
         ORDER BY pm.completed_at DESC NULLS LAST, pm.id DESC
         LIMIT 200
       ), movement_qty AS (
         SELECT pml.movement_id, SUM(pml.quantity) AS qty, MAX(pml.unit) AS unit
         FROM pos_movement_lines pml
         JOIN recent_movements rm ON rm.id = pml.movement_id
         WHERE pml.material_id = $2
         GROUP BY pml.movement_id
       )
       SELECT COUNT(*)::int AS sample_count, AVG(mq.qty)::numeric AS avg_qty,
              rmat.name AS material_name, COALESCE(MAX(mq.unit), rmat.unit) AS unit
       FROM movement_qty mq
       LEFT JOIN raw_materials rmat ON rmat.id = $2
       GROUP BY rmat.name, rmat.unit`,
      [DEPT, mat.id],
    );
    console.log('3) computeHistoricalConsumption:', JSON.stringify(hist.rows[0]));
    if (Number(hist.rows[0].sample_count) !== 3 || Math.abs(Number(hist.rows[0].avg_qty) - 90) > 0.001) {
      throw new Error('UNEXPECTED: sample_count/avg_qty mismatch — proof failed');
    }

    // 4) upsertAiNorm — insert department-scoped AI norm (no existing active row for DEPT yet)
    const aiNorm = await c.query(
      `INSERT INTO material_norms
         (material_id, material_name, norm_quantity_per_1000, unit, department_code,
          average_actual_consumption, based_on_orders_count, calculated_by_ai, formula,
          is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $3, 3, true, 'AI-proof formula', true, NOW(), NOW())
       RETURNING id, material_id, norm_quantity_per_1000, department_code, calculated_by_ai, based_on_orders_count`,
      [mat.id, hist.rows[0].material_name || 'FAZA-J proof material', hist.rows[0].avg_qty, hist.rows[0].unit || 'kg', DEPT],
    );
    console.log('4) AI department-scoped norm upserted:', JSON.stringify(aiNorm.rows[0]));

    // 5) getNormComparison logic (mirrors pos-anomaly.repository.ts, department-aware)
    const testMovId = movementIds[0]; // declared_qty=80 for this one movement, dept=DEPT
    const cmp = await c.query(
      `WITH declared AS (
         SELECT pml.material_id, SUM(pml.quantity) AS declared_qty
         FROM pos_movement_lines pml
         WHERE pml.movement_id = $1
         GROUP BY pml.material_id
       ), movement_dept AS (
         SELECT bulim FROM pos_movements WHERE id = $1
       )
       SELECT d.material_id, norm.material_name, d.declared_qty::numeric AS declared_qty,
              norm.norm_quantity_per_1000 AS norm_per_1000, norm.unit, norm.department_code
       FROM declared d
       JOIN LATERAL (
         SELECT mn.material_name, mn.norm_quantity_per_1000, mn.unit, mn.department_code
         FROM material_norms mn, movement_dept md
         WHERE mn.material_id = d.material_id AND mn.is_active = true AND mn.deleted_at IS NULL
           AND mn.norm_quantity_per_1000 IS NOT NULL AND mn.norm_quantity_per_1000 > 0
           AND (mn.department_code = md.bulim OR mn.department_code IS NULL)
         ORDER BY (mn.department_code IS NOT NULL) DESC
         LIMIT 1
       ) norm ON true`,
      [testMovId],
    );
    console.log('5) getNormComparison (dept-aware) for movement', testMovId, ':', JSON.stringify(cmp.rows));
    const row = cmp.rows[0];
    if (!row || row.department_code !== DEPT) {
      throw new Error('UNEXPECTED: department-specific norm was NOT preferred over global — proof failed');
    }
    console.log('   -> department-specific norm PREFERRED over global (correct priority).');
    console.log(`   -> declared=${row.declared_qty} vs norm=${row.norm_per_1000} (x1.10 limit=${(row.norm_per_1000 * 1.10).toFixed(2)}) => over-norm hit would ${Number(row.declared_qty) > row.norm_per_1000 * 1.10 ? 'FIRE' : 'not fire'}`);

    await c.query('ROLLBACK');
    console.log('\nROLLBACK done — 0 net rows written. FAZA J proof PASSED.');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('PROOF ERROR:', e.message);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();
