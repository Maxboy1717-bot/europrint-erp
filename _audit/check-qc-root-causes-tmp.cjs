const { Pool } = require('pg');
const p = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
(async () => {
  try {
    const cols = await p.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'qc_root_causes'
      ORDER BY ordinal_position
    `);
    console.log('--- columns ---');
    console.table(cols.rows);
    const cons = await p.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'qc_root_causes'::regclass
    `);
    console.log('--- constraints ---');
    console.table(cons.rows);
    const cnt = await p.query(`SELECT COUNT(*)::int AS n FROM qc_root_causes`);
    console.log('count:', cnt.rows[0].n);

    console.log('--- qc_defects columns ---');
    const dcols = await p.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'qc_defects'
      ORDER BY ordinal_position
    `);
    console.table(dcols.rows);

    console.log('--- production_sessions columns (like %defect% or %downtime% or %cause%) ---');
    const pcols = await p.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'production_sessions'
      ORDER BY ordinal_position
    `);
    console.table(pcols.rows);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    await p.end();
  }
})();
