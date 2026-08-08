/**
 * A7 DB-PROOF: cc_notification_prefs upsert (mirrors CcNotificationPrefsRepository.upsert).
 * Pick a user with NO prefs row -> upsert urgent_only=true -> SELECT (persisted?) -> DELETE -> report.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({ host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432), user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres', database: process.env.PGDATABASE || 'europrint' });
(async () => {
  const c = await pool.connect();
  let uid = null;
  try {
    const u = (await c.query(`SELECT u.id FROM users u LEFT JOIN cc_notification_prefs p ON p.user_id=u.id WHERE p.user_id IS NULL ORDER BY u.id LIMIT 1`)).rows[0];
    if (!u) throw new Error('no user without prefs row to test');
    uid = u.id;
    // mirror repo.upsert (INSERT ... ON CONFLICT)
    await c.query(
      `INSERT INTO cc_notification_prefs (user_id, urgent_only, telegram_enabled, reminders_enabled, language, updated_at)
       VALUES ($1, true, true, true, 'uz', NOW())
       ON CONFLICT (user_id) DO UPDATE SET urgent_only=EXCLUDED.urgent_only, updated_at=NOW()`, [uid]);
    const sel = (await c.query(`SELECT user_id, urgent_only, language FROM cc_notification_prefs WHERE user_id=$1`, [uid])).rows[0];
    console.log('1) UPSERTED+READ :', JSON.stringify(sel), '(urgent_only must be true)');
    const del = await c.query(`DELETE FROM cc_notification_prefs WHERE user_id=$1`, [uid]);
    console.log('2) cleanup del   :', del.rowCount);
    const rem = (await c.query(`SELECT count(*)::int n FROM cc_notification_prefs WHERE user_id=$1`, [uid])).rows[0].n;
    console.log('3) remaining     :', rem, '(must be 0)');
  } catch (e) {
    console.error('ERROR:', e.message);
    if (uid) { try { await c.query(`DELETE FROM cc_notification_prefs WHERE user_id=$1`, [uid]); } catch (_) {} }
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
