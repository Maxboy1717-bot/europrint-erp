/**
 * pos_movements / pos_movement_lines VIEW larni TABLE ga aylantirish
 *
 * Joriy holat:
 *   - pos_movements         = VIEW (material_movements ustida)
 *   - pos_movement_lines    = VIEW (material_movements ustida)
 *   - Drizzle kodi ularga INSERT qilmoqchi — VIEW ga INSERT ishlamaydi → 500
 *
 * Yechim:
 *   1. Eski VIEW larni saqlab qolish uchun nomini o'zgartirish
 *      (pos_movements → pos_movements_legacy_view)
 *   2. Yangi pos_movements TABLE yaratish (kod kutadigan schema bilan)
 *   3. Yangi pos_movement_lines TABLE yaratish
 *   4. Eski material_movements ma'lumotlarini saqlab qolish
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 VIEW larni TABLE ga aylantirish');
    console.log('═══════════════════════════════════════════════════\n');

    // ─── 1. pos_movements VIEW ni saqlab nomini o'zgartirish ────────────
    console.log('1️⃣  pos_movements VIEW saqlanmoqda...');
    const v1 = await client.query(`
      SELECT 1 FROM pg_class WHERE relname = 'pos_movements' AND relkind = 'v'
    `);
    if (v1.rows.length > 0) {
      // Mavjud view larni saqlab qolish — read-only legacy view
      await client.query(`DROP VIEW IF EXISTS pos_movement_lines CASCADE`);
      console.log('   🗑️  pos_movement_lines VIEW o\'chirildi');

      await client.query(`ALTER VIEW pos_movements RENAME TO pos_movements_legacy_view`);
      console.log('   📦 pos_movements → pos_movements_legacy_view (saqlandi)');
    } else {
      console.log('   ⏭️  pos_movements VIEW yo\'q (allaqachon o\'chirilgan?)');
    }

    // ─── 2. Yangi pos_movements TABLE ─────────────────────────────────────
    console.log('\n2️⃣  Yangi pos_movements TABLE yaratilmoqda...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pos_movements (
        id                       SERIAL PRIMARY KEY,
        movement_number          VARCHAR(50)  NOT NULL UNIQUE,
        movement_type            VARCHAR(30)  NOT NULL,
        movement_type_id         INTEGER,
        status                   VARCHAR(20)  NOT NULL DEFAULT 'draft',
        from_warehouse_id        INTEGER,
        to_warehouse_id          INTEGER,
        received_by_employee_id  INTEGER,
        supplier_id              VARCHAR(50),
        cash_paid                BOOLEAN      NOT NULL DEFAULT false,
        cash_amount              NUMERIC(15,2) DEFAULT 0,
        return_reason            TEXT,
        currency                 VARCHAR(3)   NOT NULL DEFAULT 'UZS',
        exchange_rate            NUMERIC(15,4) NOT NULL DEFAULT 1,
        total_amount             NUMERIC(15,2) NOT NULL DEFAULT 0,
        total_amount_base        NUMERIC(15,2) NOT NULL DEFAULT 0,
        quarantine_required      BOOLEAN      NOT NULL DEFAULT false,
        qc_status                VARCHAR(20),
        qc_completed_at          TIMESTAMP,
        qc_completed_by          INTEGER,
        ai_gl_status             VARCHAR(20)  DEFAULT 'PENDING',
        ai_gl_posted_at          TIMESTAMP,
        gl_document_id           INTEGER,
        purchase_order_id        VARCHAR(50),
        goods_receipt_id         VARCHAR(50),
        invoice_id               VARCHAR(50),
        three_way_matched        BOOLEAN      NOT NULL DEFAULT false,
        telegram_sent            BOOLEAN      NOT NULL DEFAULT false,
        is_offline_sync          BOOLEAN      NOT NULL DEFAULT false,
        offline_queue_id         INTEGER,
        act_pdf_path             TEXT,
        invoice_pdf_path         TEXT,
        reference_doc            VARCHAR(100),
        notes                    TEXT,
        created_by               INTEGER      NOT NULL,
        approved_by              INTEGER,
        approved_at              TIMESTAMP,
        completed_at             TIMESTAMP,
        cancelled_at             TIMESTAMP,
        cancel_reason            TEXT,
        deleted_at               TIMESTAMP,
        created_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);
    console.log('   ✅ pos_movements TABLE yaratildi');

    // Indekslar
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movements_type ON pos_movements(movement_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movements_status ON pos_movements(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movements_from_wh ON pos_movements(from_warehouse_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movements_to_wh ON pos_movements(to_warehouse_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movements_created_by ON pos_movements(created_by)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movements_created_at ON pos_movements(created_at)`);
    console.log('   ✅ 6 ta indeks qo\'shildi');

    // ─── 3. Yangi pos_movement_lines TABLE ───────────────────────────────
    console.log('\n3️⃣  Yangi pos_movement_lines TABLE yaratilmoqda...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS pos_movement_lines (
        id                      SERIAL PRIMARY KEY,
        movement_id             INTEGER NOT NULL REFERENCES pos_movements(id) ON DELETE CASCADE,
        material_card_id        INTEGER NOT NULL,
        batch_id                INTEGER,
        serial_number_item_id   INTEGER,
        bin_id                  VARCHAR(50),
        unit                    VARCHAR(20) NOT NULL DEFAULT 'dona',
        quantity                NUMERIC(15,4) NOT NULL,
        unit_price              NUMERIC(15,2) NOT NULL DEFAULT 0,
        total_price             NUMERIC(15,2) NOT NULL DEFAULT 0,
        currency                VARCHAR(3) DEFAULT 'UZS',
        exchange_rate           NUMERIC(15,4) DEFAULT 1,
        unit_price_base         NUMERIC(15,2) DEFAULT 0,
        total_price_base        NUMERIC(15,2) DEFAULT 0,
        fifo_sequence           INTEGER NOT NULL DEFAULT 0,
        expiry_date             TIMESTAMP,
        batch_number            VARCHAR(100),
        reservation_id          INTEGER,
        sort_order              INTEGER NOT NULL DEFAULT 0,
        notes                   TEXT,
        created_at              TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('   ✅ pos_movement_lines TABLE yaratildi');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movement_lines_movement ON pos_movement_lines(movement_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pos_movement_lines_material ON pos_movement_lines(material_card_id)`);
    console.log('   ✅ 2 ta indeks qo\'shildi');

    // ─── 4. Yakuniy tasdiqlash ───────────────────────────────────────────
    console.log('\n📊 Yakuniy holat:');
    const finalRes = await client.query(`
      SELECT c.relname AS name,
             CASE c.relkind WHEN 'r' THEN 'TABLE' WHEN 'v' THEN 'VIEW' ELSE c.relkind::text END AS kind
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname IN ('pos_movements', 'pos_movement_lines', 'pos_movements_legacy_view', 'material_movements')
       ORDER BY c.relname
    `);
    for (const r of finalRes.rows) {
      console.log(`   [${r.kind.padEnd(6)}] ${r.name}`);
    }

    // Ustunlar soni
    const movCols = await client.query(`
      SELECT COUNT(*)::int AS cnt FROM information_schema.columns WHERE table_name = 'pos_movements'
    `);
    const lineCols = await client.query(`
      SELECT COUNT(*)::int AS cnt FROM information_schema.columns WHERE table_name = 'pos_movement_lines'
    `);
    console.log(`\n   pos_movements: ${movCols.rows[0].cnt} ta ustun`);
    console.log(`   pos_movement_lines: ${lineCols.rows[0].cnt} ta ustun`);

    await client.query('COMMIT');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 MUVAFFAQIYAT!');
    console.log('═══════════════════════════════════════════════════');
    console.log('Endi:');
    console.log('  ✅ pos_movements = haqiqiy TABLE (yozish uchun)');
    console.log('  ✅ pos_movement_lines = haqiqiy TABLE');
    console.log('  📦 Eski material_movements ma\'lumotlari saqlanadi');
    console.log('  📦 pos_movements_legacy_view orqali eski ma\'lumot ko\'rsa bo\'ladi');
    console.log('\nBrauzerda F5 va "Karantinga yuborish" ni sinab ko\'ring.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Xato:', err.message);
    console.error('   code:', err.code, 'detail:', err.detail);
    console.error('   ROLLBACK qilindi — hech narsa o\'zgartirilmadi');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
