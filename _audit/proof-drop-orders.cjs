'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function main() {
  // Before: confirm table exists
  const before = await p.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'orders'
    ) AS exists
  `);
  console.log('Before DROP — orders exists:', before.rows[0].exists);

  // Execute DROP CASCADE (only deps: auto-indexes + id sequence — no FK children)
  await p.query('DROP TABLE IF EXISTS orders CASCADE');
  console.log('DROP TABLE IF EXISTS orders CASCADE — executed');

  // After: confirm table gone
  const after = await p.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'orders'
    ) AS exists
  `);
  console.log('After DROP — orders exists:', after.rows[0].exists);

  // Confirm sales_orders still intact
  const so = await p.query('SELECT COUNT(*) AS cnt FROM sales_orders');
  console.log('sales_orders intact — row count:', so.rows[0].cnt);

  await p.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
