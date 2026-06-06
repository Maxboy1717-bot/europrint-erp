'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  try {
    // #13 oee_records (production-efficiency)
    const r1 = await p.query(`
      SELECT machine_id, COUNT(*)::int AS records, ROUND(AVG(oee)::numeric, 2) AS avg_oee
      FROM oee_records
      WHERE TRUE
      GROUP BY machine_id
      ORDER BY avg_oee DESC NULLS LAST
      LIMIT 5
    `);
    console.log('oee_records aggregate OK rows=', r1.rows.length, r1.rows[0] ?? '(empty OK)');

    // #24 production_orders (production-reports/orders)
    const r2 = await p.query(
      `SELECT COUNT(*)::int AS cnt FROM production_orders WHERE deleted_at IS NULL`
    );
    console.log('production_orders SELECT OK count=', r2.rows[0].cnt);

    console.log('ALL CHECKS PASSED');
  } finally {
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
