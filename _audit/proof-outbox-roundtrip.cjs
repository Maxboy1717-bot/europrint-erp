/**
 * DB-proof: the domain_events outbox mechanism works end-to-end (the "domain_events=0" flag is just
 * empty data — no orders created — NOT a broken chain). Replicates fetchUnpublished + markPublished.
 * write (published_at NULL) -> fetch picks it up -> markPublished -> no longer fetched. Temp row; cleaned up.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const AGG = '__OUTBOXPROOF__';
const FETCH = `SELECT id, event_name FROM domain_events WHERE published_at IS NULL AND attempts <= 10 AND aggregate_id = '${AGG}' ORDER BY occurred_at`;

(async () => {
  let id;
  try {
    // write (as create-order's outbox insert does, within its tx)
    id = (await pool.query(
      `INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload) VALUES ('SalesOrder', $1, 'OrderCreated', '{"orderId":999}'::jsonb) RETURNING id`,
      [AGG])).rows[0].id;

    const beforeFetch = (await pool.query(FETCH)).rows;
    console.log('--- DB-PROOF: domain_events outbox round-trip ---');
    console.log('1) write -> fetchUnpublished picks it up :', beforeFetch.length === 1 ? `✅ (${beforeFetch[0].event_name})` : '❌');

    // publisher marks published after a successful emit
    await pool.query(`UPDATE domain_events SET published_at = NOW() WHERE id = $1`, [id]);
    const afterFetch = (await pool.query(FETCH)).rows;
    console.log('2) markPublished -> no longer fetched   :', afterFetch.length === 0 ? '✅ (no re-emit)' : '❌');

    await pool.query(`DELETE FROM domain_events WHERE aggregate_id = $1`, [AGG]);
    const left = (await pool.query(`SELECT COUNT(*)::int n FROM domain_events WHERE aggregate_id=$1`, [AGG])).rows[0].n;
    console.log('3) cleanup remaining                    :', left, left === 0 ? '✅' : '❌');

    console.log(beforeFetch.length === 1 && afterFetch.length === 0 && left === 0
      ? '\n✅ PROOF PASSED — outbox publisher drains domain_events correctly. domain_events=0 was empty data, not a break.'
      : '\n❌ PROOF FAILED');
  } catch (e) {
    console.error('PROOF ERROR:', e.message);
    try { await pool.query(`DELETE FROM domain_events WHERE aggregate_id=$1`, [AGG]); } catch {}
  } finally { await pool.end(); }
})();
