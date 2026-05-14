/**
 * Omborni TIZIMLI tartiblash uchun barcha kerakli jadvallar/ustunlar/seedlar
 *
 *  1. pos_gl_postings          — GL Journal yozuvlari
 *  2. three_way_match_log      — PO ↔ Receipt ↔ Invoice solishtirish
 *  3. employee_balances        — Xodim balansi (har material bo'yicha)
 *  4. goods_receipts           — Qabul Akti (GRN) — alohida jadval
 *  5. warehouse_kpi_cache      — KPI metric kesh
 *  6. low_stock_alerts         — Past stok ogohlantirishlari
 *  7. material_supplier_ratings — Ta'minotchi reytingi
 *  8. label_print_history      — Label chop etish tarixi
 *  9. INDEX larni qo'shish — barcha jadvallar uchun
 * 10. pos_movement_types da 7 ta tur tasdiqlash (idempotent)
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

async function tableExists(name) {
  const r = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name=$1`, [name]);
  return r.rows.length > 0;
}

try {
  await client.query('BEGIN');

  console.log('═══════════════════════════════════════════════════');
  console.log('🏗️  Ombor TIZIMLI tartiblash boshlanmoqda');
  console.log('═══════════════════════════════════════════════════\n');

  // ─── 1. pos_gl_postings (GL Journal) ─────────────────────────────────
  console.log('1️⃣  pos_gl_postings — GL Journal');
  if (!(await tableExists('pos_gl_postings'))) {
    await client.query(`
      CREATE TABLE pos_gl_postings (
        id              SERIAL PRIMARY KEY,
        movement_id     INTEGER REFERENCES pos_movements(id) ON DELETE SET NULL,
        debit_account   VARCHAR(20) NOT NULL,
        credit_account  VARCHAR(20) NOT NULL,
        amount          NUMERIC(15,2) NOT NULL,
        currency        VARCHAR(3) NOT NULL DEFAULT 'UZS',
        exchange_rate   NUMERIC(15,4) NOT NULL DEFAULT 1,
        amount_base     NUMERIC(15,2) NOT NULL,
        description     TEXT,
        posting_date    DATE NOT NULL DEFAULT CURRENT_DATE,
        posted_by       VARCHAR(20) DEFAULT 'AI',
        is_approved     BOOLEAN NOT NULL DEFAULT false,
        approved_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at     TIMESTAMP,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX idx_gl_movement ON pos_gl_postings(movement_id)`);
    await client.query(`CREATE INDEX idx_gl_date ON pos_gl_postings(posting_date)`);
    await client.query(`CREATE INDEX idx_gl_accounts ON pos_gl_postings(debit_account, credit_account)`);
    console.log('   ✅ yaratildi (4 indeks)');
  } else console.log('   ⏭️  bor');

  // ─── 2. three_way_match_log ──────────────────────────────────────────
  console.log('\n2️⃣  three_way_match_log — 3-tomonlama solishtirish');
  if (!(await tableExists('three_way_match_log'))) {
    await client.query(`
      CREATE TABLE three_way_match_log (
        id                  SERIAL PRIMARY KEY,
        movement_id         INTEGER REFERENCES pos_movements(id) ON DELETE CASCADE,
        purchase_order_no   VARCHAR(100),
        receipt_no          VARCHAR(100),
        invoice_no          VARCHAR(100),
        po_quantity         NUMERIC(15,4),
        received_quantity   NUMERIC(15,4),
        invoiced_quantity   NUMERIC(15,4),
        po_amount           NUMERIC(15,2),
        invoice_amount      NUMERIC(15,2),
        qty_variance        NUMERIC(15,4) GENERATED ALWAYS AS (received_quantity - po_quantity) STORED,
        amount_variance     NUMERIC(15,2) GENERATED ALWAYS AS (invoice_amount - po_amount) STORED,
        match_status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        notes               TEXT,
        matched_at          TIMESTAMP,
        matched_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX idx_3way_movement ON three_way_match_log(movement_id)`);
    await client.query(`CREATE INDEX idx_3way_status ON three_way_match_log(match_status)`);
    console.log('   ✅ yaratildi');
  } else console.log('   ⏭️  bor');

  // ─── 3. employee_balances — xodim balansi ────────────────────────────
  console.log('\n3️⃣  employee_balances — Xodim balansi');
  if (!(await tableExists('employee_balances'))) {
    await client.query(`
      CREATE TABLE employee_balances (
        id                SERIAL PRIMARY KEY,
        user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        material_card_id  INTEGER NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
        issued_quantity   NUMERIC(15,4) NOT NULL DEFAULT 0,
        returned_quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
        current_balance   NUMERIC(15,4) GENERATED ALWAYS AS (issued_quantity - returned_quantity) STORED,
        total_value       NUMERIC(15,2) NOT NULL DEFAULT 0,
        status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        last_movement_at  TIMESTAMP,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, material_card_id)
      )`);
    await client.query(`CREATE INDEX idx_emp_balance_user ON employee_balances(user_id)`);
    await client.query(`CREATE INDEX idx_emp_balance_status ON employee_balances(status)`);
    console.log('   ✅ yaratildi (UNIQUE: user+material)');
  } else console.log('   ⏭️  bor');

  // ─── 4. goods_receipts (GRN) ─────────────────────────────────────────
  console.log('\n4️⃣  goods_receipts — Qabul Akti (GRN)');
  if (!(await tableExists('goods_receipts'))) {
    await client.query(`
      CREATE TABLE goods_receipts (
        id                  SERIAL PRIMARY KEY,
        grn_number          VARCHAR(50) NOT NULL UNIQUE,
        movement_id         INTEGER REFERENCES pos_movements(id) ON DELETE SET NULL,
        purchase_order_id   VARCHAR(50),
        supplier_name       TEXT NOT NULL,
        supplier_tin        VARCHAR(20),
        warehouse_id        INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
        received_date       DATE NOT NULL DEFAULT CURRENT_DATE,
        waybill_number      VARCHAR(100),
        contract_number     VARCHAR(100),
        total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
        currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
        status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        notes               TEXT,
        received_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at         TIMESTAMP,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX idx_grn_status ON goods_receipts(status)`);
    await client.query(`CREATE INDEX idx_grn_supplier ON goods_receipts(supplier_name)`);
    await client.query(`CREATE INDEX idx_grn_warehouse ON goods_receipts(warehouse_id)`);
    console.log('   ✅ yaratildi (3 indeks)');
  } else console.log('   ⏭️  bor');

  // ─── 5. warehouse_kpi_cache ──────────────────────────────────────────
  console.log('\n5️⃣  warehouse_kpi_cache — KPI kesh');
  if (!(await tableExists('warehouse_kpi_cache'))) {
    await client.query(`
      CREATE TABLE warehouse_kpi_cache (
        id              SERIAL PRIMARY KEY,
        warehouse_id    INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
        metric_key      VARCHAR(50) NOT NULL,
        metric_value    NUMERIC(15,4) NOT NULL,
        metric_unit     VARCHAR(20),
        calculated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at      TIMESTAMP,
        UNIQUE (warehouse_id, metric_key)
      )`);
    await client.query(`CREATE INDEX idx_kpi_cache_key ON warehouse_kpi_cache(metric_key)`);
    console.log('   ✅ yaratildi');
  } else console.log('   ⏭️  bor');

  // ─── 6. low_stock_alerts ─────────────────────────────────────────────
  console.log('\n6️⃣  low_stock_alerts — Past stok ogohlantirishlari');
  if (!(await tableExists('low_stock_alerts'))) {
    await client.query(`
      CREATE TABLE low_stock_alerts (
        id                  SERIAL PRIMARY KEY,
        material_card_id    INTEGER NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
        warehouse_id        INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
        current_stock       NUMERIC(15,4) NOT NULL,
        min_stock           NUMERIC(15,4) NOT NULL,
        severity            VARCHAR(20) NOT NULL DEFAULT 'LOW',
        is_resolved         BOOLEAN NOT NULL DEFAULT false,
        notified_to         JSONB DEFAULT '[]'::jsonb,
        notified_at         TIMESTAMP,
        resolved_at         TIMESTAMP,
        created_at          TIMESTAMP NOT NULL DEFAULT NOW()
      )`);
    await client.query(`CREATE UNIQUE INDEX uq_alert_open ON low_stock_alerts(material_card_id, warehouse_id) WHERE is_resolved = false`);
    await client.query(`CREATE INDEX idx_alert_severity ON low_stock_alerts(severity)`);
    console.log('   ✅ yaratildi (faqat ochiq alert UNIQUE)');
  } else console.log('   ⏭️  bor');

  // ─── 7. material_supplier_ratings ────────────────────────────────────
  console.log('\n7️⃣  material_supplier_ratings — Ta\'minotchi reytingi');
  if (!(await tableExists('material_supplier_ratings'))) {
    await client.query(`
      CREATE TABLE material_supplier_ratings (
        id                  SERIAL PRIMARY KEY,
        supplier_name       TEXT NOT NULL,
        material_card_id    INTEGER REFERENCES material_cards(id) ON DELETE CASCADE,
        total_orders        INTEGER NOT NULL DEFAULT 0,
        total_quantity      NUMERIC(15,4) NOT NULL DEFAULT 0,
        total_amount        NUMERIC(15,2) NOT NULL DEFAULT 0,
        on_time_deliveries  INTEGER NOT NULL DEFAULT 0,
        late_deliveries     INTEGER NOT NULL DEFAULT 0,
        qc_approved         INTEGER NOT NULL DEFAULT 0,
        qc_rejected         INTEGER NOT NULL DEFAULT 0,
        avg_price           NUMERIC(15,2),
        rating              NUMERIC(3,2),
        last_order_at       TIMESTAMP,
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (supplier_name, material_card_id)
      )`);
    await client.query(`CREATE INDEX idx_supplier_rating ON material_supplier_ratings(rating DESC NULLS LAST)`);
    console.log('   ✅ yaratildi');
  } else console.log('   ⏭️  bor');

  // ─── 8. label_print_history ──────────────────────────────────────────
  console.log('\n8️⃣  label_print_history — Label chop tarixi');
  if (!(await tableExists('label_print_history'))) {
    await client.query(`
      CREATE TABLE label_print_history (
        id                  SERIAL PRIMARY KEY,
        barcode_queue_id    INTEGER REFERENCES pos_barcode_print_queue(id) ON DELETE SET NULL,
        barcode             VARCHAR(200) NOT NULL,
        material_card_id    INTEGER REFERENCES material_cards(id) ON DELETE SET NULL,
        movement_id         INTEGER REFERENCES pos_movements(id) ON DELETE SET NULL,
        printer_id          INTEGER,
        printed_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
        copies              INTEGER NOT NULL DEFAULT 1,
        format              VARCHAR(20) NOT NULL DEFAULT 'CODE128',
        status              VARCHAR(20) NOT NULL DEFAULT 'PRINTED',
        printed_at          TIMESTAMP NOT NULL DEFAULT NOW()
      )`);
    await client.query(`CREATE INDEX idx_label_history_barcode ON label_print_history(barcode)`);
    await client.query(`CREATE INDEX idx_label_history_date ON label_print_history(printed_at DESC)`);
    console.log('   ✅ yaratildi');
  } else console.log('   ⏭️  bor');

  // ─── 9. Yakuniy tasdiqlash ──────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 Yakuniy holat:');
  for (const tbl of [
    'pos_gl_postings', 'three_way_match_log', 'employee_balances',
    'goods_receipts', 'warehouse_kpi_cache', 'low_stock_alerts',
    'material_supplier_ratings', 'label_print_history',
  ]) {
    const ok = await tableExists(tbl);
    console.log(`   ${ok ? '✅' : '❌'} ${tbl}`);
  }

  await client.query('COMMIT');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 1-BOSQICH TAYYOR — 8 ta jadval qo\'shildi');
  console.log('═══════════════════════════════════════════════════');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('❌ Xato:', err.message);
  console.error('   code:', err.code, 'detail:', err.detail);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
