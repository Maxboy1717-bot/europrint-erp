#!/usr/bin/env node
/* eslint-disable */
/**
 * A16 DB-PROOF (rollback-tx): PP released → MES production_session.
 *
 * Exercises the EXACT INSERT from pp-released-mes.listener.ts against a real
 * production_orders row, proving the golden-thread HOP-2 actually opens ONE
 * `pending` session linked to the PO (production_order_id + order_id + target_quantity),
 * and that the NOT EXISTS guard makes a second fire idempotent (0 rows).
 *
 * Everything runs inside BEGIN ... ROLLBACK — no data is mutated.
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

// The listener's INSERT, verbatim (params: poId).
const LISTENER_INSERT = `
  INSERT INTO production_sessions
    (session_number, production_order_id, order_id, equipment_id, worker_id, status, target_quantity, started_at, created_at)
  SELECT $1, po.id, po.sales_order_id, 0, 0, 'pending',
         COALESCE(po.planned_quantity, 0)::int, NOW(), NOW()
  FROM production_orders po
  WHERE po.id = $2
    AND NOT EXISTS (
      SELECT 1 FROM production_sessions s
      WHERE s.production_order_id = $2
        AND s.status IN ('pending', 'in_progress', 'running', 'paused')
    )
  RETURNING id, session_number, production_order_id, order_id, status, target_quantity`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Pick a real PO that has NO open session yet (so the first fire actually inserts).
    const poRes = await client.query(`
      SELECT po.id, po.sales_order_id, po.planned_quantity
      FROM production_orders po
      WHERE NOT EXISTS (
        SELECT 1 FROM production_sessions s
        WHERE s.production_order_id = po.id
          AND s.status IN ('pending','in_progress','running','paused')
      )
      ORDER BY po.id DESC LIMIT 1`);
    if (!poRes.rows[0]) {
      console.log('SKIP: every production_order already has an open session — cannot prove fresh insert.');
      await client.query('ROLLBACK');
      return;
    }
    const po = poRes.rows[0];
    const poId = Number(po.id);
    const sessionNumber = `MES-PO${poId}`;
    console.log('Target PO:', { id: poId, sales_order_id: po.sales_order_id, planned_quantity: po.planned_quantity });

    // FIRE 1 — should insert exactly one pending session.
    const fire1 = await client.query(LISTENER_INSERT, [sessionNumber, poId]);
    console.log('FIRE 1 inserted rows:', fire1.rowCount);
    console.log('FIRE 1 session:', JSON.stringify(fire1.rows[0]));

    // Assertions on the inserted row.
    const s = fire1.rows[0] || {};
    const checks = {
      'inserted 1 row':                 fire1.rowCount === 1,
      'status is pending':              s.status === 'pending',
      'production_order_id = PO id':     Number(s.production_order_id) === poId,
      'order_id = PO.sales_order_id':    String(s.order_id) === String(po.sales_order_id),
      'target_quantity = planned (int)': Number(s.target_quantity) === Math.trunc(Number(po.planned_quantity || 0)),
    };

    // FIRE 2 — idempotent: open session now exists → must insert 0.
    const fire2 = await client.query(LISTENER_INSERT, [sessionNumber, poId]);
    console.log('FIRE 2 inserted rows (expect 0):', fire2.rowCount);
    checks['idempotent: 2nd fire inserts 0'] = fire2.rowCount === 0;

    // Verify the session is visible to the canonical MES list filter (status enum).
    const listVisible = await client.query(
      `SELECT 1 FROM production_sessions WHERE production_order_id=$1 AND status IN ('pending','in_progress','paused','completed','failed') LIMIT 1`,
      [poId]);
    checks['visible to canonical MES status filter'] = listVisible.rowCount === 1;

    await client.query('ROLLBACK');

    console.log('\n--- ASSERTIONS ---');
    let allPass = true;
    for (const [k, v] of Object.entries(checks)) {
      console.log(`${v ? 'PASS' : 'FAIL'}: ${k}`);
      if (!v) allPass = false;
    }
    console.log(`\n${allPass ? 'ALL PASS ✅ (rolled back, no data changed)' : 'SOME FAIL ❌'}`);
    process.exitCode = allPass ? 0 : 1;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR: ' + e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
