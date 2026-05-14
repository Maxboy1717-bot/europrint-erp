/**
 * pos_movements / pos_movement_lines schema fix
 *
 * Schema drift muammosini hal qiladi:
 *   - Eski jadval ustunlarini yangi nomlarga aylantiradi (RENAME)
 *   - Kod kutadigan barcha yetishmagan ustunlarni qo'shadi (ADD COLUMN)
 *   - Idempotent — qayta ishga tushishi xavfsiz
 *
 * Usage: node scripts/fix-movements-schema.mjs
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL topilmadi');
  process.exit(1);
}

async function columnExists(client, table, column) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return r.rows.length > 0;
}

async function renameColumn(client, table, oldName, newName) {
  const hasOld = await columnExists(client, table, oldName);
  const hasNew = await columnExists(client, table, newName);
  if (hasOld && !hasNew) {
    await client.query(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`);
    console.log(`   🔄 ${table}.${oldName} → ${newName}`);
    return true;
  } else if (hasNew) {
    console.log(`   ⏭️  ${table}.${newName} allaqachon bor`);
  } else {
    console.log(`   ⚠️  ${table}.${oldName} topilmadi (skip)`);
  }
  return false;
}

async function addColumn(client, table, column, definition) {
  if (!(await columnExists(client, table, column))) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`   ➕ ${table}.${column} (${definition.substring(0, 50)})`);
    return true;
  } else {
    console.log(`   ⏭️  ${table}.${column} bor`);
  }
  return false;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  let totalAdded = 0, totalRenamed = 0;

  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 pos_movements jadvalini tuzatish');
    console.log('═══════════════════════════════════════════════════\n');

    // ─── RENAMES (eski → yangi nom) ─────────────────────────────────────
    console.log('📝 RENAME ustunlar:');
    if (await renameColumn(client, 'pos_movements', 'reference_number', 'movement_number')) totalRenamed++;
    if (await renameColumn(client, 'pos_movements', 'type',             'movement_type'))   totalRenamed++;
    if (await renameColumn(client, 'pos_movements', 'warehouse_from_id','from_warehouse_id')) totalRenamed++;
    if (await renameColumn(client, 'pos_movements', 'warehouse_to_id',  'to_warehouse_id'))   totalRenamed++;
    if (await renameColumn(client, 'pos_movements', 'performed_by',     'created_by'))        totalRenamed++;

    // ─── ADD COLUMNS ─────────────────────────────────────────────────────
    console.log('\n➕ ADD COLUMNS:');
    const movementColumns = [
      ['movement_number',       `varchar(50)`],
      ['movement_type',         `varchar(30)`],
      ['from_warehouse_id',     `integer`],
      ['to_warehouse_id',       `integer`],
      ['received_by_employee_id', `integer`],
      ['supplier_id',           `varchar(50)`],
      ['cash_paid',             `boolean NOT NULL DEFAULT false`],
      ['cash_amount',           `numeric(15,2) DEFAULT 0`],
      ['return_reason',         `text`],
      ['currency',              `varchar(3) NOT NULL DEFAULT 'UZS'`],
      ['exchange_rate',         `numeric(15,4) NOT NULL DEFAULT 1`],
      ['total_amount',          `numeric(15,2) NOT NULL DEFAULT 0`],
      ['total_amount_base',     `numeric(15,2) NOT NULL DEFAULT 0`],
      ['quarantine_required',   `boolean NOT NULL DEFAULT false`],
      ['qc_completed_at',       `timestamp`],
      ['qc_completed_by',       `integer`],
      ['ai_gl_status',          `varchar(20) DEFAULT 'PENDING'`],
      ['ai_gl_posted_at',       `timestamp`],
      ['gl_document_id',        `integer`],
      ['purchase_order_id',     `varchar(50)`],
      ['goods_receipt_id',      `varchar(50)`],
      ['invoice_id',            `varchar(50)`],
      ['three_way_matched',     `boolean NOT NULL DEFAULT false`],
      ['telegram_sent',         `boolean NOT NULL DEFAULT false`],
      ['is_offline_sync',       `boolean NOT NULL DEFAULT false`],
      ['offline_queue_id',      `integer`],
      ['act_pdf_path',          `text`],
      ['invoice_pdf_path',      `text`],
      ['reference_doc',         `varchar(100)`],
      ['approved_by',           `integer`],
      ['approved_at',           `timestamp`],
      ['completed_at',          `timestamp`],
      ['cancelled_at',          `timestamp`],
      ['cancel_reason',         `text`],
      ['deleted_at',            `timestamp`],
      ['updated_at',            `timestamp NOT NULL DEFAULT NOW()`],
    ];
    for (const [col, def] of movementColumns) {
      if (await addColumn(client, 'pos_movements', col, def)) totalAdded++;
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔧 pos_movement_lines jadvalini tuzatish');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('➕ ADD COLUMNS:');
    const lineColumns = [
      ['batch_id',           `integer`],
      ['serial_number_item_id', `integer`],
      ['bin_id',             `varchar(50)`],
      ['unit_price',         `numeric(15,2) NOT NULL DEFAULT 0`],
      ['total_price',        `numeric(15,2) NOT NULL DEFAULT 0`],
      ['currency',           `varchar(3) DEFAULT 'UZS'`],
      ['exchange_rate',      `numeric(15,4) DEFAULT 1`],
      ['unit_price_base',    `numeric(15,2) DEFAULT 0`],
      ['total_price_base',   `numeric(15,2) DEFAULT 0`],
      ['fifo_sequence',      `integer NOT NULL DEFAULT 0`],
      ['reservation_id',     `integer`],
      ['sort_order',         `integer NOT NULL DEFAULT 0`],
      ['notes',              `text`],
    ];
    for (const [col, def] of lineColumns) {
      if (await addColumn(client, 'pos_movement_lines', col, def)) totalAdded++;
    }

    // ─── Eski 'type' ustuni yana paydo bo'lsa, sinxron qilish ───────────
    // Eski yozuvlarda type to'ldirilgan bo'lsa, movement_type ham to'ldirilsin
    console.log('\n🔄 Eski yozuvlar uchun movement_type sinxronlash:');
    const syncRes = await client.query(`
      UPDATE pos_movements
         SET movement_type = COALESCE(movement_type, (
           SELECT code FROM pos_movement_types WHERE id = movement_type_id
         ))
       WHERE movement_type IS NULL AND movement_type_id IS NOT NULL
    `);
    console.log(`   🔄 ${syncRes.rowCount} ta yozuv yangilandi`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`📈 Natija: ${totalAdded} ta ustun qo'shildi, ${totalRenamed} ta o'zgartirildi`);
    console.log('═══════════════════════════════════════════════════');

    // ─── Yakuniy struktura ──────────────────────────────────────────────
    console.log('\n📋 pos_movements yakuniy ustunlari:');
    const finalCols = await client.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name = 'pos_movements'
       ORDER BY ordinal_position
    `);
    console.log('   ' + finalCols.rows.map(r => r.column_name).join(', '));

    console.log('\n📋 pos_movement_lines yakuniy ustunlari:');
    const finalLineCols = await client.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name = 'pos_movement_lines'
       ORDER BY ordinal_position
    `);
    console.log('   ' + finalLineCols.rows.map(r => r.column_name).join(', '));

    console.log('\n🎉 Migration muvaffaqiyatli! POST /movements endi ishlashi kerak.');
    console.log('   Backend log da 500 chiqmasligi kerak — sinab ko\'ring.');
  } catch (err) {
    console.error('\n❌ Asosiy xato:', err.message);
    console.error('   code:', err.code, 'detail:', err.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
