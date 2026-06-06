#!/usr/bin/env node
/* eslint-disable */
/**
 * WORLD 4 (STOCK): Drop wms_stock + wms_stock_levels.
 * OWNER-APPROVED: WORLD 4 decision 2026-06-06.
 *   - wms_stock: 0 rows, only id/qty/batch_no/notes cols (no material_id/warehouse_id) — dead prototype
 *   - wms_stock_levels: 0 rows, no INSERT writers — dead prototype
 * Run once: node _audit/drop-wms-stock-world4.cjs
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r1 = await client.query("DROP TABLE IF EXISTS wms_stock CASCADE");
    console.log('DROP TABLE wms_stock:', r1.command);

    const r2 = await client.query("DROP TABLE IF EXISTS wms_stock_levels CASCADE");
    console.log('DROP TABLE wms_stock_levels:', r2.command);

    await client.query('COMMIT');
    console.log('COMMIT OK — wms_stock + wms_stock_levels dropped.');

    // Verify gone
    const check = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name IN ('wms_stock','wms_stock_levels') AND table_schema='public'"
    );
    console.log('Remaining (should be empty):', check.rows);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
