/* Additive migration faylni jonli qo'llash (multi-statement DDL). Argument = .sql fayl yo'li. europrint@127.0.0.1:5432.
   Faqat additive (IF NOT EXISTS / ON CONFLICT) migrationlar uchun — idempotent. */
const fs = require('path');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const file = process.argv[2];
if (!file) { console.error('SQL fayl yo\'li kerak'); process.exit(1); }
const sql = require('fs').readFileSync(file, 'utf8');
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(sql);
    console.log('✅ QO\'LLANDI: ' + path.basename(file));
  } catch (e) {
    console.error('❌ XATO (' + path.basename(file) + '): ' + e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
})();
