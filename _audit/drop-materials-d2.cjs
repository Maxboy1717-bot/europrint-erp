#!/usr/bin/env node
/* eslint-disable */
/**
 * D2: Drop mm_materials VIEW and materials TABLE.
 * OWNER-APPROVED: D2 decision 2026-06-06.
 * Run once: node _audit/drop-materials-d2.cjs
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

    const r1 = await client.query("DROP VIEW IF EXISTS mm_materials CASCADE");
    console.log('DROP VIEW mm_materials:', r1.command);

    const r2 = await client.query("DROP TABLE IF EXISTS materials CASCADE");
    console.log('DROP TABLE materials:', r2.command);

    await client.query('COMMIT');
    console.log('COMMIT OK — mm_materials VIEW + materials TABLE dropped.');

    // Verify gone
    const check = await client.query(
      "SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('materials','mm_materials') AND table_schema='public'"
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
