'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  let expId, invId;
  try {
    // INSERT expense_report
    const rn = 'EXP-PROOF-' + Date.now();
    const e = await p.query(
      `INSERT INTO expense_reports (expense_request_id, report_number, total_spent, total_receipts, status, submitted_by, currency, created_at)
       VALUES (0, $1, 999, 0, 'pending', 1, 'UZS', NOW()) RETURNING id`,
      [rn]
    );
    expId = e.rows[0].id;
    console.log('expense_reports INSERT OK id=', expId);

    // SELECT back
    const es = await p.query('SELECT id, report_number, status FROM expense_reports WHERE id=$1', [expId]);
    console.log('expense_reports SELECT OK', es.rows[0]);

    // INSERT invoice
    const invn = 'INV-PROOF-' + Date.now();
    const i = await p.query(
      `INSERT INTO invoices (id, invoice_number, customer_name, items, subtotal, tax_amount, total_amount, status, created_by)
       VALUES (gen_random_uuid(), $1, 'Test Customer', '[]'::jsonb, 500, 0, 500, 'draft', '00000000-0000-0000-0000-000000000000'::uuid) RETURNING id`,
      [invn]
    );
    invId = i.rows[0].id;
    console.log('invoices INSERT OK id=', invId);

    const is2 = await p.query('SELECT id, invoice_number, status FROM invoices WHERE id=$1', [invId]);
    console.log('invoices SELECT OK', is2.rows[0]);

    console.log('ALL CHECKS PASSED');
  } finally {
    if (expId) await p.query('DELETE FROM expense_reports WHERE id=$1', [expId]);
    if (invId) await p.query('DELETE FROM invoices WHERE id=$1', [invId]);
    console.log('Cleanup done');
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
