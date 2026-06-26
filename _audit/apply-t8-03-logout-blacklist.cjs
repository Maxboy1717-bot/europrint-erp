/** T8-03 (egasi vakolati, 2026-06-26): logout token-blacklist fix.
 *  refresh_tokens.user_id UUID NOT NULL -> NULLABLE (FK yo'q, default yo'q, lookup jti/token orqali);
 *  + user_id_text TEXT (auth user.id INTEGER audit qiymati — fabrikatsiya yo'q). ADDITIV, idempotent. */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });
(async () => {
  const c = await pool.connect();
  try {
    await c.query(`ALTER TABLE IF EXISTS refresh_tokens ALTER COLUMN user_id DROP NOT NULL`);
    await c.query(`ALTER TABLE IF EXISTS refresh_tokens ADD COLUMN IF NOT EXISTS user_id_text TEXT`);
    await c.query(`ALTER TABLE IF EXISTS refresh_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid()`);
    const r = await c.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='refresh_tokens' AND column_name IN ('id','user_id','user_id_text') ORDER BY column_name`);
    console.log('APPLIED T8-03:', JSON.stringify(r.rows));
  } catch (e) { console.error('ERR', e.message); }
  finally { c.release(); await pool.end(); }
})();
