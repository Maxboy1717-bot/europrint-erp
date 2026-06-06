'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret

async function run() {
  try {
    // #6 equipment_maintenance (predictive-maintenance route)
    const r1 = await p.query(
      `SELECT COUNT(*)::int AS cnt FROM equipment_maintenance WHERE status IS DISTINCT FROM 'completed'`
    );
    console.log('equipment_maintenance SELECT OK count=', r1.rows[0].cnt);

    // #11 payroll_tax_rules (tax-calendar route)
    const r2 = await p.query(`SELECT COUNT(*)::int AS cnt FROM payroll_tax_rules WHERE is_active = true`);
    console.log('payroll_tax_rules SELECT OK active_count=', r2.rows[0].cnt);

    // Sample row to verify columns exist
    const r3 = await p.query(
      `SELECT tax_code, tax_name, rate, effective_from, effective_to FROM payroll_tax_rules LIMIT 1`
    );
    console.log('payroll_tax_rules sample row:', r3.rows[0] ?? '(empty table OK)');

    // #12 salary_bands (salary-benchmark route)
    const r4 = await p.query(`SELECT COUNT(*)::int AS cnt FROM salary_bands WHERE is_active = true`);
    console.log('salary_bands SELECT OK active_count=', r4.rows[0].cnt);

    // Verify key columns
    const r5 = await p.query(
      `SELECT position_id, min_salary, max_salary, mid_salary FROM salary_bands LIMIT 1`
    );
    console.log('salary_bands sample row:', r5.rows[0] ?? '(empty table OK)');

    console.log('ALL CHECKS PASSED');
  } finally {
    p.end();
  }
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
