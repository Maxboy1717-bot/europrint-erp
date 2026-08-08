/**
 * Apply pos-material-norms-department-2026-07-01.sql (idempotent, additive) + verify.
 * APPROVED: egasi vizyon-qurish 2026-07-01, FAZA J (Bo'lim ombori + AI norma).
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret (local dev DB, matches all _audit/apply-*.cjs)
const sqlFile = path.join(__dirname, '..', 'apps', 'api', 'src', 'shared', 'db', 'migrations', 'pos-material-norms-department-2026-07-01.sql');
(async () => {
  try {
    await pool.query(fs.readFileSync(sqlFile, 'utf8'));
    const col = await pool.query(`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name='material_norms' AND column_name='department_code'`);
    console.log('material_norms.department_code:', JSON.stringify(col.rows));
    const idx = await pool.query(`SELECT indexname FROM pg_indexes WHERE tablename='material_norms' AND indexname='idx_material_norms_material_dept'`);
    console.log('idx_material_norms_material_dept exists:', idx.rows.length === 1);
  } catch (e) {
    console.error('MIGRATION ERROR:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
