'use strict';
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg')); // allow-secret
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
async function run() {
  const tables = [
    'nps_responses', 'vendor_performance', 'sd_payments',
    'warehouses', 'material_movements', 'employee_files', 'hr_documents',
    'employee_documents',
  ];
  for (const t of tables) {
    const r = await p.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=$1 AND table_schema='public' ORDER BY ordinal_position LIMIT 12`, [t]);
    if (r.rows.length) {
      console.log(t + ': ' + r.rows.map(x => x.column_name + '(' + (x.is_nullable==='NO'?'NN':'ok') + ')').join(', '));
    } else {
      console.log(t + ': NOT FOUND');
    }
  }
  p.end();
}
run().catch(e => { console.error('FAIL', e.message); p.end(); process.exit(1); });
