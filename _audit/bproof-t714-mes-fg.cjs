#!/usr/bin/env node
/* eslint-disable */
/**
 * T7-14 — MES->WMS FG kirim avto (oltin-ip) JONLI ISBOT (rollback-tx).
 *
 * Vizyon: "MES FG chiqarganda avtomatik FINISHED_GOODS ombori kirim" (EP-WMS-034/023).
 * Yangi MesCompletedFgListener AYNAN bajaradigan ish (lookup + receiveFg yozuvlari)
 *   real tugallangan sessiya (35 -> PO 48 -> product 49 -> FG ombor 13) ustida ijro etiladi:
 *     1) lookup: material_id (product_id), produced_qty (actual_quantity), FG warehouse, SO, idempotency
 *     2) warehouse_stock UPSERT (execReceiveFg shakli) + wms_transactions IN qator (execInsertWmsTransaction shakli)
 *     3) 2-marta fire -> IDEMPOTENT (NOT EXISTS batch_number='MES-<sessId>')
 *     4) FABRIKATSIYA YO'Q: material/qty/FG-ombor yetishmasa SKIP
 * Hamma narsa BEGIN ... ROLLBACK ichida — DB O'ZGARMAYDI (Q-29).
 */
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1', port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres', password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'europrint',
});
const checks = [];
function assert(cond, msg){ checks.push({ok:!!cond,msg}); console.log('  ' + (cond?'PASS':'FAIL') + ': ' + msg); return !!cond; }
async function countOf(c,t){ const r=await c.query('SELECT COUNT(*)::int n FROM ' + t); return r.rows[0].n; }

// Listener lookup (AYNAN .ts dagi SQL shakli)
function lookup(sessionId, batchNumber){
  return {
    text: 'SELECT po.product_id AS material_id, '
      + 'COALESCE(ps.actual_quantity, ps.produced_qty, 0)::int AS produced_qty, '
      + "(SELECT w.id FROM warehouses w WHERE w.type='finished_goods' ORDER BY w.id LIMIT 1) AS warehouse_id, "
      + 'po.sales_order_id AS sales_order_id, '
      + "(SELECT COUNT(*) FROM wms_transactions wt WHERE wt.type='IN' AND wt.batch_number=$2)::int AS already_received "
      + 'FROM production_sessions ps JOIN production_orders po ON po.id = ps.production_order_id '
      + 'WHERE ps.id = $1 LIMIT 1',
    values: [sessionId, batchNumber],
  };
}
// receiveFg yozuvlari: warehouse_stock UPSERT + wms_transactions IN (execReceiveFg + execInsertWmsTransaction shakli)
async function receiveFg(c, whId, matId, amount, batchNumber, refId){
  await c.query(
    'INSERT INTO warehouse_stock (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at) '
    + 'VALUES ($1,$2,$3,0,$3,NOW(),NOW(),NOW()) '
    + 'ON CONFLICT (warehouse_id, material_id) DO UPDATE SET '
    + 'quantity = warehouse_stock.quantity + $3, available_quantity = warehouse_stock.available_quantity + $3, '
    + 'last_movement_at = NOW(), last_updated_at = NOW()', [whId, matId, amount]);
  await c.query(
    'INSERT INTO wms_transactions (warehouse_id, material_id, type, quantity, reference_id, created_by, notes, batch_number, created_at) '
    + "VALUES ($1,$2,'IN',$3,$4,NULL,$5,$6,NOW())",
    [whId, matId, amount, refId == null ? null : refId, 'FG receipt ' + batchNumber, batchNumber]);
}

(async () => {
  const c = await pool.connect(); let crashed=false;
  try {
    const tables = ['warehouse_stock','wms_transactions'];
    const before = {}; for (const t of tables) before[t]=await countOf(c,t);
    console.log('BEFORE:', JSON.stringify(before));
    await c.query('BEGIN');

    // ── real tugallangan sessiya 35 ──
    const SESS = 35; const BATCH = 'MES-' + SESS;
    const lk = await c.query(lookup(SESS, BATCH));
    const info = lk.rows[0];
    console.log('\n── LOOKUP (sessiya 35) ──'); console.dir(info);
    assert(info, 'lookup: tugallangan sessiya + PO topildi');
    assert(Number(info.material_id) === 49, 'material_id = product_id (49) — FG material PO dan keladi');
    assert(Number(info.produced_qty) === 4950, 'produced_qty = actual_quantity (4950) — real ishlab chiqilgan');
    assert(Number(info.warehouse_id) === 13, 'FG ombor = finished_goods (13)');
    assert(Number(info.sales_order_id) === 56, 'sales_order_id = 56 (FG attribution)');
    assert(Number(info.already_received) === 0, "idempotency: bu sessiya uchun hali FG kirim yo'q");

    // ── 1-fire: FG kirim yaratiladi ──
    console.log('\n── 1-FIRE: FG kirim ──');
    await receiveFg(c, Number(info.warehouse_id), Number(info.material_id), Number(info.produced_qty), BATCH, Number(info.sales_order_id));
    const w1 = await countOf(c,'warehouse_stock'); const t1 = await countOf(c,'wms_transactions');
    const wtRow = (await c.query('SELECT warehouse_id, material_id, type, quantity, reference_id, batch_number FROM wms_transactions WHERE batch_number=$1', [BATCH])).rows[0];
    console.log('   wms_transaction:', JSON.stringify(wtRow));
    assert(t1 === before.wms_transactions + 1, 'wms_transactions: +1 (' + before.wms_transactions + '->' + t1 + ') — IN ledger qator');
    assert(wtRow && wtRow.type==='IN' && Number(wtRow.quantity)===4950 && Number(wtRow.material_id)===49 && Number(wtRow.warehouse_id)===13,
      'wms_transactions IN: FG ombor 13, material 49, qty 4950, batch ' + BATCH);
    const stockRow = (await c.query('SELECT quantity, available_quantity FROM warehouse_stock WHERE warehouse_id=13 AND material_id=49')).rows[0];
    console.log('   warehouse_stock (wh13/mat49):', JSON.stringify(stockRow));
    assert(stockRow && Number(stockRow.quantity)===4950 && Number(stockRow.available_quantity)===4950,
      'warehouse_stock: FG ombor 13 / material 49 = 4950 (yangi qator UPSERT)');

    // ── 2-fire: IDEMPOTENT (listener already_received>0 -> SKIP) ──
    console.log('\n── 2-FIRE: idempotensiya ──');
    const lk2 = await c.query(lookup(SESS, BATCH));
    assert(Number(lk2.rows[0].already_received) === 1, "2-fire lookup: already_received=1 -> listener SKIP qiladi (dublikat yo'q)");
    const t2 = await countOf(c,'wms_transactions');
    assert(t2 === t1, 'wms_transactions o\'zgarmadi (' + t1 + '->' + t2 + ') — 2-fire idempotent skip');

    // ── FABRIKATSIYA YO'Q: produced_qty=0 bo'lsa SKIP (real PO, lekin 0 ishlab chiqilgan) ──
    console.log('\n── FABRIKATSIYA YO\'Q: 0 ishlab chiqilgan -> SKIP ──');
    // Real PO (product_id NOT NULL majburiy), lekin sessiya 0 dona ishlab chiqdi.
    // Listener producedQty<=0 -> SKIP (receiveFg chaqirilmaydi, soxta 0-qty kirim yozilmaydi).
    const realPo = await c.query("INSERT INTO production_orders (order_number, product_id, planned_quantity, status, created_at, updated_at) VALUES ('TEST-T714-ZEROQTY', 1, 100, 'created', NOW(), NOW()) RETURNING id");
    const zeroSess = await c.query("INSERT INTO production_sessions (session_number, production_order_id, equipment_id, worker_id, status, target_quantity, actual_quantity, produced_qty, created_at, updated_at) VALUES ('TEST-T714-SESS0', $1, 0, 0, 'completed', 100, 0, 0, NOW(), NOW()) RETURNING id", [realPo.rows[0].id]);
    const lk3 = await c.query(lookup(zeroSess.rows[0].id, 'MES-' + zeroSess.rows[0].id));
    const zeroQty = lk3.rows[0];
    console.log('   0-qty lookup:', JSON.stringify(zeroQty));
    assert(zeroQty && Number(zeroQty.produced_qty) === 0,
      "produced_qty=0 -> listener SKIP (FABRIKATSIYA YO'Q, soxta 0-qty kirim yozilmaydi)");
    const tAfterSkip = await countOf(c,'wms_transactions');
    assert(tAfterSkip === t1, '0-qty holatda wms_transactions o\'zgarmadi (' + t1 + '->' + tAfterSkip + ') — skip real');

    await c.query('ROLLBACK'); console.log('\nROLLBACK bajarildi.');
    const after = {}; for (const t of tables) after[t]=await countOf(c,t);
    let clean=true; for (const t of tables) if (after[t]!==before[t]) clean=false;
    assert(clean, 'ROLLBACK toza: ' + JSON.stringify(after) + ' === BEFORE (DB o\'zgarmadi)');
  } catch(e){ crashed=true; try{await c.query('ROLLBACK');}catch(_){} console.error('\nPROOF XATO:', e.message); }
  finally { c.release(); await pool.end(); }

  console.log('\n════════ YAKUN ════════');
  const failed = checks.filter(x=>!x.ok); const pass = checks.length-failed.length;
  console.log('PASS=' + pass + '  FAIL=' + failed.length + '  (jami ' + checks.length + ')');
  if (crashed) console.log('STATUS: CRASH');
  else if (!failed.length) console.log("T7-14 MES->WMS FG: ALL PASS — tugallangan sessiya FG kirim avto yaratdi (warehouse_stock+wms_transactions IN), idempotent, fabrikatsiya yo'q, ROLLBACK toza.");
  else { console.log('T7-14: SOME FAIL'); failed.forEach(x=>console.log('  - '+x.msg)); }
  process.exit(!crashed && !failed.length ? 0 : 1);
})();
