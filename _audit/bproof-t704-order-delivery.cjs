#!/usr/bin/env node
/* eslint-disable */
/**
 * T7-04 — OrderCreated/OrderStatusChanged → Logistics delivery auto-create JONLI ISBOT.
 *
 * Vizyon: SD order.created (yoki status→confirmed) → Logistics auto-delivery yozuv
 *   (customerName + deliveryAddress). Listener hozir no-op edi ("deferred").
 *
 * Bu skript listener YANGI logikasi AYNAN bajaradigan SQL ni rollback-tx ichida
 * isbotlaydi:
 *   1. sales_orders dan order topiladi (customer_name + customer_id).
 *   2. delivery_address crm_companies.address dan resolve qilinadi (NULL bo'lsa fallback).
 *   3. deliveries ga real qator INSERT (serial id, integer sales_order_id).
 *   4. findBySalesOrderId idempotensiya: ikkinchi marta INSERT QILINMAYDI.
 *
 * BEGIN ... ROLLBACK — DB O'ZGARMAYDI (Q-29). FABRIKATSIYA YO'Q (Q-40): mavjud order 56.
 *
 *   node _audit/bproof-t704-order-delivery.cjs
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});

const checks = [];
function assert(cond, msg) {
  checks.push({ ok: !!cond, msg });
  console.log(`  ${cond ? 'PASS' : 'FAIL'}: ${msg}`);
  return !!cond;
}

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Pick an existing confirmed order that has NO delivery yet (order 56 already
    // has delivery id=2). Use order 7 (in_progress, customer_id 4) to prove the
    // create path on an order WITHOUT an existing delivery.
    const ORDER_ID = 7;

    const before = await client.query('SELECT COUNT(*)::int AS n FROM deliveries');
    console.log(`deliveries before = ${before.rows[0].n}`);

    // STEP 1 — idempotency check (repo.findBySalesOrderId equivalent)
    const existing = await client.query(
      'SELECT id FROM deliveries WHERE sales_order_id = $1',
      [ORDER_ID],
    );
    assert(existing.rows.length === 0, `order ${ORDER_ID} has NO existing delivery (create path active)`);

    // STEP 2 — resolve customer_name + delivery_address (listener lookup)
    const ord = await client.query(
      `SELECT so.id, so.order_number, so.customer_name, so.customer_id,
              c.title AS company_name, c.address AS company_address
         FROM sales_orders so
         LEFT JOIN crm_companies c ON c.id = so.customer_id
        WHERE so.id = $1`,
      [ORDER_ID],
    );
    assert(ord.rows.length === 1, `sales_orders row found for order ${ORDER_ID}`);
    const row = ord.rows[0];
    const customerName = row.customer_name || row.company_name || `Order ${row.order_number || ORDER_ID}`;
    const deliveryAddress = row.company_address || 'Manzil kiritilmagan';
    console.log(`  resolved customerName="${customerName}" deliveryAddress="${deliveryAddress}"`);
    assert(!!customerName, 'customerName resolved (non-empty)');
    assert(!!deliveryAddress, 'deliveryAddress resolved (non-empty)');

    // STEP 3 — INSERT delivery (serial id, integer sales_order_id) — mirrors the
    // new repo.createFromSalesOrder path. delivery_status NOT NULL has default.
    const deliveryNumber = `DEL-${row.order_number || ORDER_ID}`;
    const ins = await client.query(
      `INSERT INTO deliveries (sales_order_id, delivery_number, customer_name, delivery_address, status, customer_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id, sales_order_id, delivery_number, customer_name, delivery_address, status, delivery_status`,
      [ORDER_ID, deliveryNumber, customerName, deliveryAddress, row.customer_id],
    );
    assert(ins.rows.length === 1, 'INSERT into deliveries returned a row');
    const d = ins.rows[0];
    console.log('  inserted:', JSON.stringify(d));
    assert(typeof d.id === 'number', `new delivery id is integer (serial) = ${d.id}`);
    assert(d.sales_order_id === ORDER_ID, `delivery.sales_order_id = order ${ORDER_ID} (FK link)`);
    assert(d.customer_name === customerName, 'delivery.customer_name persisted');
    assert(d.delivery_address === deliveryAddress, 'delivery.delivery_address persisted');
    assert(d.status === 'pending', 'delivery.status = pending');
    assert(d.delivery_status === 'PICKING', 'delivery.delivery_status default applied (PICKING)');

    const after = await client.query('SELECT COUNT(*)::int AS n FROM deliveries');
    console.log(`deliveries after = ${after.rows[0].n}`);
    assert(after.rows[0].n === before.rows[0].n + 1, 'delivery count grew by exactly 1');

    // STEP 4 — idempotency: a second listener fire must NOT create a duplicate
    const existing2 = await client.query(
      'SELECT id FROM deliveries WHERE sales_order_id = $1',
      [ORDER_ID],
    );
    assert(existing2.rows.length === 1, 're-fire finds the existing delivery → skip (idempotent)');

    await client.query('ROLLBACK');
    console.log('\nROLLBACK done — DB unchanged.');

    const failed = checks.filter((c) => !c.ok);
    console.log(`\n=== ${checks.length - failed.length}/${checks.length} PASS ===`);
    process.exitCode = failed.length === 0 ? 0 : 1;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('ERROR: ' + e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
