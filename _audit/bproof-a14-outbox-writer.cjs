/**
 * A14 DB-proof — outbox-event-writer atomic write into domain_events.
 * Simulates OutboxRepository.insertBatch([row]) (what OutboxEventWriter.persist calls)
 * inside a transaction, verifies the row materialised with the canonical columns,
 * then ROLLBACK (no data left). Q-29 rollback-tx proof, Q-30 no secret printed.
 */
const { Pool } = require('C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/apps/api/node_modules/pg');
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'postgres', database: 'europrint' });

(async () => {
  const c = await pool.connect();
  try {
    const before = await c.query('SELECT COUNT(*)::int AS n FROM domain_events');
    console.log('BEFORE domain_events count:', before.rows[0].n);

    await c.query('BEGIN');

    // Exactly what OutboxRepository.insertBatch does for one event produced by
    // OutboxEventWriter.extractRow (aggregate_type/aggregate_id/event_name/payload;
    // occurred_at + created_at default via the table).
    const payload = { orderId: 999001, companyId: 7, orderNumber: 'TEST-A14-SO', source: 'OutboxEventWriter' };
    const ins = await c.query(
      `INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, aggregate_type, aggregate_id, event_name, payload, occurred_at, created_at, published_at, attempts`,
      ['SalesOrder', '999001', 'OrderCreated', JSON.stringify(payload)],
    );
    const row = ins.rows[0];
    console.log('INSERTED row (inside tx):');
    console.log('  id          :', typeof row.id === 'string' && row.id.length === 36 ? '<uuid ok>' : row.id);
    console.log('  aggregate_type:', row.aggregate_type);
    console.log('  aggregate_id  :', row.aggregate_id);
    console.log('  event_name    :', row.event_name);
    console.log('  payload       :', JSON.stringify(row.payload));
    console.log('  occurred_at   :', row.occurred_at ? '<set>' : '<null>');
    console.log('  created_at    :', row.created_at ? '<set>' : '<null>');
    console.log('  published_at  :', row.published_at, '(null = picked up by OutboxPublisher next tick)');
    console.log('  attempts      :', row.attempts);

    // Re-read inside the tx to prove it is queryable like the publisher fetch.
    const reread = await c.query(
      `SELECT aggregate_type, aggregate_id, event_name FROM domain_events
       WHERE published_at IS NULL AND attempts <= 10 AND id = $1`, [row.id]);
    console.log('PUBLISHER-FETCH visibility (unpublished, attempts<=10):', reread.rowCount === 1 ? 'VISIBLE ✓' : 'NOT VISIBLE ✗');

    const within = await c.query('SELECT COUNT(*)::int AS n FROM domain_events');
    console.log('WITHIN-TX count (should be BEFORE+1):', within.rows[0].n);

    await c.query('ROLLBACK');
    console.log('ROLLBACK done.');

    const after = await c.query('SELECT COUNT(*)::int AS n FROM domain_events');
    console.log('AFTER count (should equal BEFORE):', after.rows[0].n);

    const ok = within.rows[0].n === before.rows[0].n + 1
      && after.rows[0].n === before.rows[0].n
      && reread.rowCount === 1
      && row.aggregate_type === 'SalesOrder'
      && row.event_name === 'OrderCreated'
      && row.payload.orderId === 999001
      && row.attempts === 0
      && row.published_at === null;
    console.log(ok ? 'PROOF: PASS ✓ (atomic insert visible in-tx, rolled back clean)' : 'PROOF: FAIL ✗');
    process.exit(ok ? 0 : 1);
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR:', e.message);
    process.exit(2);
  } finally {
    c.release();
    await pool.end();
  }
})();
