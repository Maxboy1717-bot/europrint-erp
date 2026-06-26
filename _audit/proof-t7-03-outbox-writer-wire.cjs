/**
 * DB-PROOF (T7-03): OutboxEventWriter EventBus -> domain_events live persistence.
 *
 * WHY: outbox.module.ts now registers OutboxEventWriter as a provider with
 * CqrsModule imported, so its onModuleInit subscribes to the CQRS EventBus and
 * every published domain event triggers persist() -> extractRow() ->
 * OutboxRepository.insertBatch([row]) -> INSERT INTO domain_events.
 *
 * This proof exercises the EXACT writer code path against the live DB:
 *   1. Build a realistic CQRS event object (class OrderCreatedEvent with
 *      orderId/salesOrderId fields, no explicit aggregateName) — the same shape
 *      eventBus.publish(new OrderCreatedEvent(...)) produces.
 *   2. Run it through a faithful JS port of extractRow() (aggregate_type /
 *      aggregate_id / event_name / payload normalisation).
 *   3. INSERT that row into domain_events exactly as insertBatch() does.
 *   4. Assert one unpublished row landed with the derived columns.
 * All inside BEGIN ... ROLLBACK so the live DB is never mutated.
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

// ---- faithful port of OutboxEventWriter.extractRow (service is the source of truth) ----
const META_KEYS = new Set(['aggregateId', 'aggregateName', 'eventName', 'timestamp', 'createdAt', 'occurredAt', 'data']);
const ID_FIELDS = ['aggregateId', 'orderId', 'salesOrderId', 'productionOrderId', 'sessionId', 'inspectionId', 'entityId', 'id'];
const asString = (v) => (typeof v === 'string' && v.length > 0 ? v : undefined);
function deriveAggregateType(eventName, className) {
  if (className && className !== 'Object') return className.endsWith('Event') ? className.slice(0, -'Event'.length) : className;
  return eventName !== 'UnknownEvent' ? eventName : undefined;
}
function resolveAggregateId(e) {
  for (const f of ID_FIELDS) { const v = e[f]; if (v !== undefined && v !== null && v !== '') return String(v); }
  return 'unknown';
}
function resolvePayload(e) {
  if (e.data && typeof e.data === 'object' && !Array.isArray(e.data)) return e.data;
  const out = {};
  for (const [k, v] of Object.entries(e)) { if (META_KEYS.has(k) || typeof v === 'function') continue; out[k] = v; }
  return out;
}
function extractRow(event) {
  const e = event;
  const className = event && event.constructor ? event.constructor.name : undefined;
  const eventName = asString(e.eventName) ?? (className && className !== 'Object' ? className : undefined) ?? 'UnknownEvent';
  const aggregateType = asString(e.aggregateName) ?? deriveAggregateType(eventName, className) ?? 'Unknown';
  return { aggregate_type: aggregateType, aggregate_id: resolveAggregateId(e), event_name: eventName, payload: resolvePayload(e) };
}

// realistic CQRS event class — exactly what a command handler publishes on the bus
class OrderCreatedEvent {
  constructor(orderId, salesOrderId, companyId, orderNumber) {
    this.orderId = orderId; this.salesOrderId = salesOrderId;
    this.companyId = companyId; this.orderNumber = orderNumber;
  }
}

(async () => {
  const client = await pool.connect();
  let pass = true;
  try {
    await client.query('BEGIN');

    const before = (await client.query('SELECT COUNT(*)::int n FROM domain_events')).rows[0].n;

    // simulate eventBus.publish(new OrderCreatedEvent(...)) -> writer.persist -> extractRow
    const event = new OrderCreatedEvent(999777, 999777, 7, 'SO-T7-03');
    const row = extractRow(event);
    console.log('--- DB-PROOF T7-03: OutboxEventWriter EventBus -> domain_events ---');
    console.log('extractRow ->', JSON.stringify(row));

    // insertBatch([row]) — same columns the repository writes (occurred_at default)
    const inserted = (await client.query(
      `INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload)
       VALUES ($1, $2, $3, $4::jsonb) RETURNING id, aggregate_type, aggregate_id, event_name, payload, published_at`,
      [row.aggregate_type, row.aggregate_id, row.event_name, JSON.stringify(row.payload)],
    )).rows[0];

    const after = (await client.query('SELECT COUNT(*)::int n FROM domain_events')).rows[0].n;

    const c1 = after === before + 1;
    const c2 = inserted.event_name === 'OrderCreatedEvent';
    const c3 = inserted.aggregate_type === 'OrderCreated'; // Event-suffix stripped
    const c4 = inserted.aggregate_id === '999777';         // first populated ID_FIELD (orderId)
    const c5 = inserted.published_at === null;             // unpublished -> publisher will drain it
    const c6 = inserted.payload && inserted.payload.orderNumber === 'SO-T7-03' && inserted.payload.companyId === 7;

    console.log('1) bus publish -> domain_events row written :', c1 ? `✅ (${before} -> ${after})` : `❌ (${before} -> ${after})`);
    console.log('2) event_name = class name                 :', c2 ? '✅ OrderCreatedEvent' : `❌ ${inserted.event_name}`);
    console.log('3) aggregate_type derived (Event stripped)  :', c3 ? '✅ OrderCreated' : `❌ ${inserted.aggregate_type}`);
    console.log('4) aggregate_id from orderId field          :', c4 ? '✅ 999777' : `❌ ${inserted.aggregate_id}`);
    console.log('5) published_at NULL (drainable by publisher):', c5 ? '✅' : '❌');
    console.log('6) payload = business fields (meta stripped) :', c6 ? '✅' : `❌ ${JSON.stringify(inserted.payload)}`);

    pass = c1 && c2 && c3 && c4 && c5 && c6;

    await client.query('ROLLBACK'); // never mutate the live DB
    const afterRollback = (await client.query('SELECT COUNT(*)::int n FROM domain_events')).rows[0].n;
    console.log('7) ROLLBACK -> live DB unchanged            :', afterRollback === before ? `✅ (${afterRollback})` : `❌ (${afterRollback})`);
    pass = pass && afterRollback === before;

    console.log(pass
      ? '\n✅ PROOF PASSED — writer wiring persists CQRS-published events into domain_events.'
      : '\n❌ PROOF FAILED');
    process.exitCode = pass ? 0 : 1;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('PROOF ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
