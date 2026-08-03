const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' }); // allow-secret
const Q = {
  complaints: `SELECT * FROM sd_customer_complaints ORDER BY id DESC LIMIT 100`,
  skips: `SELECT * FROM assessment_skips ORDER BY id DESC LIMIT 100`,
  mentorships: `SELECT * FROM mentorships ORDER BY id DESC LIMIT 100`,
  mes: `SELECT * FROM production_facts ORDER BY id DESC LIMIT 200`,
  wms: `SELECT * FROM wms_transactions ORDER BY id DESC LIMIT 100`,
};
(async () => {
  const c = await pool.connect();
  try {
    for (const [name, q] of Object.entries(Q)) {
      const r = await c.query(q);
      console.log(`  ${name.padEnd(12)}: OK, ${r.rowCount} row(s) (query valid + executes)`);
    }
    console.log('ALL 5 list queries execute cleanly (no error).');
  } catch (e) { console.error('ERROR:', e.message); process.exitCode = 1; }
  finally { c.release(); await pool.end(); }
})();
