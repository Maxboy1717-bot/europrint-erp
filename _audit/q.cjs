#!/usr/bin/env node
/* eslint-disable */
/**
 * Read-only DB query helper for the live `europrint` database.
 *
 *   node _audit/q.cjs "SELECT 1"
 *
 * Safety: every statement runs inside a `BEGIN TRANSACTION READ ONLY` ... `ROLLBACK`
 * block, so the database itself rejects any write (INSERT/UPDATE/DELETE/DDL), even
 * if one slips past the prefix guard below. This script can NOT mutate data.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

const sqlText = process.argv.slice(2).join(' ').trim();
if (!sqlText) {
  console.error('Usage: node _audit/q.cjs "SELECT ..."');
  process.exit(1);
}

// Prefix guard (defence-in-depth; the READ ONLY tx is the real enforcement).
const head = sqlText.replace(/^[\s(]+/, '').toLowerCase();
if (!/^(select|with|explain|show|table)\b/.test(head)) {
  console.error('READ-ONLY helper: only SELECT/WITH/EXPLAIN/SHOW/TABLE allowed.');
  process.exit(2);
}

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
    await client.query('BEGIN TRANSACTION READ ONLY');
    const res = await client.query(sqlText);
    await client.query('ROLLBACK');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR: ' + e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
