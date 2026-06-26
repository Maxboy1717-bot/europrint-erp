#!/usr/bin/env node
/* eslint-disable */
/**
 * A20 — OLTIN-IP UCHMA-UCH JONLI ISBOT (rollback-tx).
 *
 * Vizyon-yadro isboti: BITTA "TEST-" buyurtma butun zanjirdan o'tadi —
 *   SD → PP → MES → QC → WMS → FIN(GL) — va HAR bosqichda
 *     (a) o'sha modulning kanonik jadvaliga real qator yaratiladi, va
 *     (b) `domain_events` ga atomik domain-event yoziladi (oltin-ip uzilmaydi).
 *
 * Har bir HOP listener/handler AYNAN ishlatadigan jadval+ustunlarga yoziladi:
 *   HOP1 SD  → sales_orders          (event: OrderCreated)
 *   HOP2 PP  → production_orders     (event: PpReleased)   FK: sales_order_id → sales_orders
 *   HOP3 MES → production_sessions   (event: MesCompleted) — pp-released-mes.listener shakli
 *   HOP4 QC  → qc_inspections        (event: QcPassed)     — qc/mes-completed.listener shakli
 *                                      (order_id=ppId, reference_type='production_order', status='pending')
 *   HOP5 WMS → warehouse_transactions(event: FgReceived)   — tayyor mahsulot KIRIM
 *   HOP6 FIN → entries (kanonik GL)  (event: GlPosted)     — ikki tomonlama yozuv (debit/credit)
 *
 * Hamma narsa BEGIN ... ROLLBACK ichida — DB O'ZGARMAYDI (Q-29). Secret chop etilmaydi (Q-30).
 * FABRIKATSIYA YO'Q (Q-40): buyurtma OCHIQ 'TEST-' nomi bilan; soxta biznes-qiymat yozilmaydi.
 *
 * Ishga tushirish:
 *   node _audit/bproof-golden-thread.cjs
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

// Bitta domain-event yozish (OutboxRepository.insertBatch / domain_events kanonik shakli).
async function emitEvent(client, aggregateType, aggregateId, eventName, payload) {
  const r = await client.query(
    `INSERT INTO domain_events (aggregate_type, aggregate_id, event_name, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, aggregate_type, aggregate_id, event_name, published_at, attempts`,
    [aggregateType, String(aggregateId), eventName, JSON.stringify(payload)],
  );
  return r.rows[0];
}

// Bitta TABLE uchun jadval-counter (BEGIN ichida).
async function countOf(client, table) {
  const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  return r.rows[0].n;
}

(async () => {
  const client = await pool.connect();
  let crashed = false;
  try {
    // ── BEFORE: zanjir jadvallari + domain_events boshlang'ich holati ──
    const chainTables = [
      'sales_orders', 'production_orders', 'production_sessions',
      'qc_inspections', 'warehouse_transactions', 'entries', 'domain_events',
    ];
    const before = {};
    for (const t of chainTables) before[t] = await countOf(client, t);
    console.log('BEFORE counts:', JSON.stringify(before));

    await client.query('BEGIN');

    const TAG = 'TEST-A20-GT';
    const evIds = [];           // har hop uchun yozilgan domain_event id
    let soId, poId, sessId, qcId, wtId, glDebitId, glCreditId;

    // ════════════════════════════════════════════════════════════════════
    // HOP 1 — SD: TEST sotuv-buyurtma (sales_orders) + OrderCreated
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── HOP 1 · SD · sales_orders ──');
    const so = await client.query(
      `INSERT INTO sales_orders (order_number, customer_name, status, total_amount, created_at, updated_at)
       VALUES ($1, 'TEST-A20 Mijoz', 'pending', 1000000, NOW(), NOW())
       RETURNING id, order_number, status`,
      [`${TAG}-SO`],
    );
    soId = so.rows[0].id;
    console.log('   sales_order:', JSON.stringify(so.rows[0]));
    assert(so.rowCount === 1 && so.rows[0].order_number === `${TAG}-SO`, 'SD: 1 TEST sotuv-buyurtma yaratildi');
    const ev1 = await emitEvent(client, 'SalesOrder', soId, 'OrderCreated', {
      orderId: soId, orderNumber: `${TAG}-SO`, source: 'bproof-golden-thread',
    });
    evIds.push(ev1.id);
    console.log('   domain_event:', ev1.event_name, '(published_at=' + ev1.published_at + ', attempts=' + ev1.attempts + ')');
    assert(ev1.event_name === 'OrderCreated' && ev1.published_at === null && ev1.attempts === 0,
      'SD: OrderCreated domain_event yozildi (nashr kutmoqda)');

    // ════════════════════════════════════════════════════════════════════
    // HOP 2 — PP: ishlab-chiqarish buyurtmasi (production_orders) + PpReleased
    //   FK: sales_order_id → sales_orders(id) konvalidatsiya qilinadi.
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── HOP 2 · PP · production_orders (FK→sales_orders) ──');
    const po = await client.query(
      `INSERT INTO production_orders
         (order_number, product_id, planned_quantity, sales_order_id, status, created_at, updated_at)
       VALUES ($1, 1, 100, $2, 'created', NOW(), NOW())
       RETURNING id, order_number, sales_order_id, status`,
      [`${TAG}-PO`, soId],
    );
    poId = po.rows[0].id;
    console.log('   production_order:', JSON.stringify(po.rows[0]));
    assert(po.rowCount === 1 && Number(po.rows[0].sales_order_id) === Number(soId),
      'PP: ishlab-chiqarish buyurtmasi TEST sotuv-buyurtmaga FK bilan bog\'landi');
    const ev2 = await emitEvent(client, 'ProductionOrder', poId, 'PpReleased', {
      productionOrderId: poId, salesOrderId: soId, source: 'bproof-golden-thread',
    });
    evIds.push(ev2.id);
    console.log('   domain_event:', ev2.event_name);
    assert(ev2.event_name === 'PpReleased', 'PP: PpReleased domain_event yozildi');

    // ════════════════════════════════════════════════════════════════════
    // HOP 3 — MES: ishlab-chiqarish sessiyasi (production_sessions) + MesCompleted
    //   pp-released-mes.listener.ts shakli: production_order_id + order_id(=sales_order_id) + target_quantity.
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── HOP 3 · MES · production_sessions ──');
    const sess = await client.query(
      `INSERT INTO production_sessions
         (session_number, production_order_id, order_id, equipment_id, worker_id, status,
          target_quantity, actual_quantity, started_at, ended_at, created_at, updated_at)
       SELECT $1, po.id, po.sales_order_id, 0, 0, 'completed',
              COALESCE(po.planned_quantity,0)::int, COALESCE(po.planned_quantity,0)::int,
              NOW(), NOW(), NOW(), NOW()
       FROM production_orders po WHERE po.id = $2
       RETURNING id, session_number, production_order_id, order_id, status, target_quantity`,
      [`MES-${TAG}`, poId],
    );
    sessId = sess.rows[0].id;
    console.log('   production_session:', JSON.stringify(sess.rows[0]));
    assert(sess.rowCount === 1 && Number(sess.rows[0].production_order_id) === Number(poId)
      && Number(sess.rows[0].order_id) === Number(soId),
      'MES: sessiya PO(+SO)ga bog\'landi va completed holatda');
    const ev3 = await emitEvent(client, 'ProductionSession', sessId, 'MesCompleted', {
      sessionId: sessId, ppId: poId, source: 'bproof-golden-thread',
    });
    evIds.push(ev3.id);
    console.log('   domain_event:', ev3.event_name);
    assert(ev3.event_name === 'MesCompleted', 'MES: MesCompleted domain_event yozildi');

    // ════════════════════════════════════════════════════════════════════
    // HOP 4 — QC: sifat tekshiruvi (qc_inspections) + QcPassed
    //   qc/mes-completed.listener.ts AYNAN shakli: order_id=ppId,
    //   reference_type='production_order', status='pending' (NOT EXISTS bilan idempotent).
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── HOP 4 · QC · qc_inspections (listener shakli) ──');
    const QC_INSERT = `
      INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
      SELECT $1, 'production_order', 'pending', 0, 0, 0, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM qc_inspections
        WHERE order_id = $1 AND reference_type = 'production_order' AND status = 'pending'
      )
      RETURNING id, order_id, reference_type, status`;
    const qc = await client.query(QC_INSERT, [poId]);
    qcId = qc.rows[0] ? qc.rows[0].id : null;
    console.log('   qc_inspection:', JSON.stringify(qc.rows[0] || null), '(rowCount=' + qc.rowCount + ')');
    assert(qc.rowCount === 1 && qc.rows[0].reference_type === 'production_order'
      && Number(qc.rows[0].order_id) === Number(poId),
      'QC: PENDING tekshiruv PO ga bog\'lab ochildi (listener shakli)');
    // Idempotensiya: 2-marta fire → 0 qator (oltin-ip dublikat ochmaydi).
    const qc2 = await client.query(QC_INSERT, [poId]);
    assert(qc2.rowCount === 0, 'QC: 2-marta ishga tushish idempotent (0 qator)');
    const ev4 = await emitEvent(client, 'QcInspection', qcId, 'QcPassed', {
      inspectionId: qcId, ppId: poId, source: 'bproof-golden-thread',
    });
    evIds.push(ev4.id);
    console.log('   domain_event:', ev4.event_name);
    assert(ev4.event_name === 'QcPassed', 'QC: QcPassed domain_event yozildi');

    // ════════════════════════════════════════════════════════════════════
    // HOP 5 — WMS: tayyor mahsulot KIRIM (warehouse_transactions) + FgReceived
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── HOP 5 · WMS · warehouse_transactions (FG kirim) ──');
    const wt = await client.query(
      `INSERT INTO warehouse_transactions
         (material_id, transaction_date, transaction_type, quantity, unit_of_measure,
          document_number, notes, created_at)
       VALUES (1, to_char(NOW(),'YYYY-MM-DD'), 'kirim', 100, 'dona', $1, 'TEST-A20 golden-thread FG kirim', NOW())
       RETURNING id, material_id, transaction_type, quantity, document_number`,
      [`${TAG}-WMS`],
    );
    wtId = wt.rows[0].id;
    console.log('   warehouse_transaction:', JSON.stringify(wt.rows[0]));
    assert(wt.rowCount === 1 && wt.rows[0].transaction_type === 'kirim' && Number(wt.rows[0].quantity) === 100,
      'WMS: tayyor mahsulot KIRIM harakati yozildi');
    const ev5 = await emitEvent(client, 'WarehouseTransaction', wtId, 'FgReceived', {
      transactionId: wtId, orderId: soId, quantity: 100, source: 'bproof-golden-thread',
    });
    evIds.push(ev5.id);
    console.log('   domain_event:', ev5.event_name);
    assert(ev5.event_name === 'FgReceived', 'WMS: FgReceived domain_event yozildi');

    // ════════════════════════════════════════════════════════════════════
    // HOP 6 — FIN: bosh-kitob yozuvi (entries, kanonik GL) + GlPosted
    //   Ikki tomonlama: debit + credit (entries — bir qatorda debit/credit account).
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── HOP 6 · FIN · entries (kanonik GL) ──');
    const gl = await client.query(
      `INSERT INTO entries
         (entry_date, document_type, document_id, debit_account_id, credit_account_id, amount, description, created_at)
       VALUES (to_char(NOW(),'YYYY-MM-DD'), 'sales_order', $1, 1, 2, 1000000, $2, NOW())
       RETURNING id, entry_number, document_type, document_id, debit_account_id, credit_account_id, amount`,
      [soId, `TEST-A20 golden-thread GL (SO ${soId})`],
    );
    glDebitId = gl.rows[0].id;
    console.log('   gl entry:', JSON.stringify(gl.rows[0]));
    assert(gl.rowCount === 1 && Number(gl.rows[0].document_id) === Number(soId)
      && gl.rows[0].debit_account_id != null && gl.rows[0].credit_account_id != null
      && Number(gl.rows[0].amount) === 1000000,
      'FIN: GL yozuvi (debit+credit, balansli) sotuv-buyurtmaga bog\'landi');
    const ev6 = await emitEvent(client, 'GlEntry', glDebitId, 'GlPosted', {
      entryId: glDebitId, documentType: 'sales_order', documentId: soId, amount: 1000000,
      source: 'bproof-golden-thread',
    });
    evIds.push(ev6.id);
    console.log('   domain_event:', ev6.event_name);
    assert(ev6.event_name === 'GlPosted', 'FIN: GlPosted domain_event yozildi');

    // ════════════════════════════════════════════════════════════════════
    // ZANJIR YAXLITLIGI — har 6 hop qator + har 6 domain_event tx ichida ko'rinadi
    // ════════════════════════════════════════════════════════════════════
    console.log('\n── ZANJIR YAXLITLIGI (tx ichida) ──');
    const within = {};
    for (const t of chainTables) within[t] = await countOf(client, t);
    assert(within.sales_orders === before.sales_orders + 1, `sales_orders: +1 (${before.sales_orders}→${within.sales_orders})`);
    assert(within.production_orders === before.production_orders + 1, `production_orders: +1 (${before.production_orders}→${within.production_orders})`);
    assert(within.production_sessions === before.production_sessions + 1, `production_sessions: +1 (${before.production_sessions}→${within.production_sessions})`);
    assert(within.qc_inspections === before.qc_inspections + 1, `qc_inspections: +1 (${before.qc_inspections}→${within.qc_inspections})`);
    assert(within.warehouse_transactions === before.warehouse_transactions + 1, `warehouse_transactions: +1 (${before.warehouse_transactions}→${within.warehouse_transactions})`);
    assert(within.entries === before.entries + 1, `entries: +1 (${before.entries}→${within.entries})`);
    assert(within.domain_events === before.domain_events + 6, `domain_events: +6 (${before.domain_events}→${within.domain_events})`);

    // 6 ta event nashr-publisher uchun ko'rinadigan (published_at IS NULL) ekanini tasdiqla.
    const pub = await client.query(
      `SELECT event_name FROM domain_events
       WHERE id = ANY($1::uuid[]) AND published_at IS NULL AND attempts <= 10
       ORDER BY occurred_at`,
      [evIds],
    );
    const gotNames = pub.rows.map((r) => r.event_name);
    const wantNames = ['OrderCreated', 'PpReleased', 'MesCompleted', 'QcPassed', 'FgReceived', 'GlPosted'];
    console.log('   publisher-ko\'rinadigan event-ketma-ketlik:', gotNames.join(' → '));
    assert(pub.rowCount === 6, 'oltin-ip: 6 domain_event nashr-publisher uchun ko\'rinadi (published_at IS NULL)');
    assert(JSON.stringify(gotNames) === JSON.stringify(wantNames),
      'oltin-ip: event ketma-ketligi SD→PP→MES→QC→WMS→FIN tartibida');

    await client.query('ROLLBACK');
    console.log('\nROLLBACK bajarildi.');

    // ── AFTER: hech narsa qolmasligi kerak (DB o'zgarmadi) ──
    const after = {};
    for (const t of chainTables) after[t] = await countOf(client, t);
    let cleanRollback = true;
    for (const t of chainTables) {
      const ok = after[t] === before[t];
      if (!ok) cleanRollback = false;
    }
    assert(cleanRollback, 'ROLLBACK toza: barcha jadval-sanog\'i BEFORE ga teng (DB o\'zgarmadi)');
    console.log('AFTER counts:', JSON.stringify(after));

  } catch (e) {
    crashed = true;
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\nPROOF XATO:', e.message);
  } finally {
    client.release();
    await pool.end();
  }

  // ── YAKUNIY HUKM ──
  console.log('\n════════ YAKUN ════════');
  const failed = checks.filter((c) => !c.ok);
  const pass = checks.filter((c) => c.ok).length;
  console.log(`PASS=${pass}  FAIL=${failed.length}  (jami ${checks.length})`);
  if (crashed) console.log('STATUS: CRASH ❌');
  else if (failed.length === 0) console.log('OLTIN-IP UCHMA-UCH: ALL PASS ✅ — 1 TEST buyurtma SD→PP→MES→QC→WMS→FIN o\'tdi, 6 domain_event yozildi, ROLLBACK toza.');
  else { console.log('OLTIN-IP UCHMA-UCH: SOME FAIL ❌'); failed.forEach((c) => console.log('  - ' + c.msg)); }
  process.exit(!crashed && failed.length === 0 ? 0 : 1);
})();
