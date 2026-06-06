#!/usr/bin/env node
/* eslint-disable */
/**
 * One-shot seed: INSERT 2 approved gl_account_mappings rows.
 * APPROVED: owner 2026-06-06 (overnight batch A.1)
 *   INTERNAL_TRANSFER    debit=1010 credit=1010  (inter-warehouse, net-zero audit trail)
 *   INVENTORY_ADJ_MINUS  debit=9500 credit=1010  (shrinkage: Dr expense / Cr material)
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

const pool = new Pool({
  host:     process.env.PGHOST     || '127.0.0.1',
  port:     Number(process.env.PGPORT || 5432),
  user:     process.env.PGUSER     || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

const ROWS = [
  {
    transaction_type: 'INTERNAL_TRANSFER',
    debit_account:    '1010',
    credit_account:   '1010',
    description:      'Omborlar arasi o\'tkazma: Dr Xom ashyo / Cr Xom ashyo (net-zero, audit trail)',
  },
  {
    transaction_type: 'INVENTORY_ADJ_MINUS',
    debit_account:    '9500',
    credit_account:   '1010',
    description:      'Inventar kamayishi: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo',
  },
];

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Guard: skip if already exists
    for (const row of ROWS) {
      const check = await client.query(
        'SELECT id FROM gl_account_mappings WHERE transaction_type = $1',
        [row.transaction_type],
      );
      if (check.rows.length > 0) {
        console.log(`SKIP: ${row.transaction_type} already exists (id=${check.rows[0].id})`);
        continue;
      }
      const res = await client.query(
        `INSERT INTO gl_account_mappings
           (transaction_type, debit_account, credit_account, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, transaction_type, debit_account, credit_account`,
        [row.transaction_type, row.debit_account, row.credit_account, row.description],
      );
      console.log('INSERTED:', JSON.stringify(res.rows[0]));
    }

    await client.query('COMMIT');

    // DB-proof
    const proof = await client.query(
      'SELECT COUNT(*)::int as cnt FROM gl_account_mappings',
    );
    console.log(`\nDB-PROOF: gl_account_mappings total = ${proof.rows[0].cnt}`);

    const all = await client.query(
      'SELECT transaction_type, debit_account, credit_account FROM gl_account_mappings ORDER BY transaction_type',
    );
    console.log('All rows:', JSON.stringify(all.rows, null, 2));
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ERROR (rolled back):', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
