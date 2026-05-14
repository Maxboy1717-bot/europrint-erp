/**
 * Karantin va Event Handler xatolarini bir vaqtda tuzatish:
 *
 *   1. pos_inventory_passport TABLE yaratish (mavjud emas)
 *      → "Karantinga yuborish" passport yaratadi → karantin sahifasi to'ladi
 *
 *   2. users.telegram_id ustuni qo'shish (PosEventHandler xatosi)
 *      → "select telegram_id from users where role in (...)" ishlaydi
 *
 *   3. pos_movements.bulim ustuni qo'shish (PosWmsSyncService xatosi)
 *      → WMS sinxronizatsiyasi ishlaydi
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
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
    [name]
  );
  return r.rows.length > 0;
}

async function columnExists(table, column) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return r.rows.length > 0;
}

try {
  await client.query('BEGIN');

  console.log('═══════════════════════════════════════════════════');
  console.log('🔧 1. pos_inventory_passport TABLE');
  console.log('═══════════════════════════════════════════════════');

  if (await tableExists('pos_inventory_passport')) {
    console.log('   ⏭️  pos_inventory_passport allaqachon bor');
  } else {
    await client.query(`
      CREATE TABLE pos_inventory_passport (
        id                       SERIAL PRIMARY KEY,
        movement_id              INTEGER NOT NULL REFERENCES pos_movements(id) ON DELETE CASCADE,
        material_code            VARCHAR(100),
        supplier_name            TEXT,
        contract_number          VARCHAR(100),
        waybill_number           VARCHAR(100),
        arrival_date             DATE NOT NULL DEFAULT CURRENT_DATE,
        quantity                 NUMERIC(15,4) NOT NULL,
        weight_kg                NUMERIC(15,4),
        volume_m3                NUMERIC(15,4),
        certificate_number       VARCHAR(100),
        quarantine_started_at    TIMESTAMP DEFAULT NOW(),
        qc_started_at            TIMESTAMP,
        qc_result                VARCHAR(20),
        qc_note                  TEXT,
        transferred_at           TIMESTAMP,
        created_at               TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX idx_pos_passport_movement ON pos_inventory_passport(movement_id)`);
    await client.query(`CREATE INDEX idx_pos_passport_qc_result ON pos_inventory_passport(qc_result)`);
    await client.query(`CREATE INDEX idx_pos_passport_arrival ON pos_inventory_passport(arrival_date)`);
    console.log('   ✅ pos_inventory_passport TABLE yaratildi (3 ta indeks bilan)');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🔧 2. users.telegram_id');
  console.log('═══════════════════════════════════════════════════');

  if (await columnExists('users', 'telegram_id')) {
    console.log('   ⏭️  users.telegram_id allaqachon bor');
  } else {
    await client.query(`ALTER TABLE users ADD COLUMN telegram_id VARCHAR(50)`);
    await client.query(`CREATE INDEX idx_users_telegram_id ON users(telegram_id) WHERE telegram_id IS NOT NULL`);
    console.log('   ✅ users.telegram_id qo\'shildi (indeks bilan)');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🔧 3. pos_movements.bulim');
  console.log('═══════════════════════════════════════════════════');

  if (await columnExists('pos_movements', 'bulim')) {
    console.log('   ⏭️  pos_movements.bulim allaqachon bor');
  } else {
    await client.query(`ALTER TABLE pos_movements ADD COLUMN bulim VARCHAR(100)`);
    console.log('   ✅ pos_movements.bulim qo\'shildi');
  }

  await client.query('COMMIT');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 MUVAFFAQIYAT!');
  console.log('═══════════════════════════════════════════════════');
  console.log('Endi quyidagilar ishlaydi:');
  console.log('  ✅ "Karantinga yuborish" → passport yaratiladi');
  console.log('  ✅ Karantin sahifasi → passport ro\'yxati ko\'rinadi');
  console.log('  ✅ WMS sinxronizatsiyasi → bulim bo\'yicha');
  console.log('  ✅ Telegram bildirishnomalar → users.telegram_id orqali');
  console.log('\nBrauzerda F5 va yangi "Karantinga yuborish" sinab ko\'ring.');
  console.log('Keyin "Karantin" sahifasiga o\'ting — yangi yozuv ko\'rinishi kerak.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('\n❌ Xato:', err.message);
  console.error('   code:', err.code, 'detail:', err.detail);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
