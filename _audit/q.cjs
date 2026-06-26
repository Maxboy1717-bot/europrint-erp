/* Read-only jonli SQL tekshiruv (verify-don't-trust, Q-29). Argument = SQL. europrint@127.0.0.1:5432.
   Misol: node _audit/q.cjs "SELECT count(*) FROM users" */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const sql = process.argv.slice(2).join(' ');
if (!sql.trim()) { console.error('SQL argument kerak'); process.exit(1); }
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    const r = await c.query(sql);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error('SQL-XATO:', e.message);
  } finally {
    c.release();
    await pool.end();
  }
})();
