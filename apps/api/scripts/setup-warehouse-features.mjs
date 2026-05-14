/**
 * Ombor xususiyatlarini sozlash:
 *   1. warehouse_employees jadvali (har omborga xodim biriktirish)
 *   2. pos_movements ga unit_of_measure ko'rsatish uchun listing optimizatsiya
 *   3. Auto-barcode trigger uchun pos_barcode_print_queue tekshirish
 *   4. Material 360 profili uchun kerakli indekslar
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

async function columnExists(table, column) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return r.rows.length > 0;
}

try {
  await client.query('BEGIN');

  // ─── 1. warehouse_employees TABLE ─────────────────────────────────────
  console.log('═══ 1. warehouse_employees TABLE ═══');
  if (!(await tableExists('warehouse_employees'))) {
    await client.query(`
      CREATE TABLE warehouse_employees (
        id            SERIAL PRIMARY KEY,
        warehouse_id  INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role          VARCHAR(30) NOT NULL DEFAULT 'staff',
        is_primary    BOOLEAN NOT NULL DEFAULT false,
        assigned_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        assigned_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        removed_at    TIMESTAMP,
        notes         TEXT,
        CONSTRAINT warehouse_employees_role_check
          CHECK (role IN ('manager','staff','keeper','qc_inspector','observer'))
      )
    `);
    await client.query(`CREATE INDEX idx_wh_emp_warehouse ON warehouse_employees(warehouse_id) WHERE removed_at IS NULL`);
    await client.query(`CREATE INDEX idx_wh_emp_user ON warehouse_employees(user_id) WHERE removed_at IS NULL`);
    await client.query(`CREATE UNIQUE INDEX uq_wh_emp_active ON warehouse_employees(warehouse_id, user_id) WHERE removed_at IS NULL`);
    console.log('   ✅ warehouse_employees yaratildi (FK + 3 indeks)');
  } else {
    console.log('   ⏭️  Allaqachon bor');
  }

  // ─── 2. pos_barcode_print_queue tekshirish ────────────────────────────
  console.log('\n═══ 2. pos_barcode_print_queue ═══');
  if (await tableExists('pos_barcode_print_queue')) {
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name='pos_barcode_print_queue' ORDER BY ordinal_position
    `);
    console.log(`   ✅ Mavjud (${cols.rows.length} ustun): ${cols.rows.map(r=>r.column_name).join(', ')}`);

    // Yetishmagan ustunlarni qo'shish
    const needed = [
      ['movement_id',    'INTEGER REFERENCES pos_movements(id) ON DELETE SET NULL'],
      ['movement_line_id', 'INTEGER REFERENCES pos_movement_lines(id) ON DELETE SET NULL'],
      ['material_card_id', 'INTEGER REFERENCES material_cards(id) ON DELETE SET NULL'],
      ['warehouse_id',   'INTEGER REFERENCES warehouses(id) ON DELETE SET NULL'],
      ['batch_number',   'VARCHAR(100)'],
      ['quantity',       'NUMERIC(15,4)'],
      ['unit',           'VARCHAR(20)'],
      ['barcode',        'VARCHAR(200)'],
      ['barcode_type',   `VARCHAR(20) DEFAULT 'CODE128'`],
      ['status',         `VARCHAR(20) DEFAULT 'QUEUED'`],
      ['printed_at',     'TIMESTAMP'],
      ['printed_by',     'INTEGER REFERENCES users(id) ON DELETE SET NULL'],
    ];
    for (const [col, def] of needed) {
      if (!(await columnExists('pos_barcode_print_queue', col))) {
        await client.query(`ALTER TABLE pos_barcode_print_queue ADD COLUMN ${col} ${def}`);
        console.log(`   ➕ ${col} qo'shildi`);
      }
    }
  } else {
    await client.query(`
      CREATE TABLE pos_barcode_print_queue (
        id                SERIAL PRIMARY KEY,
        movement_id       INTEGER REFERENCES pos_movements(id) ON DELETE SET NULL,
        movement_line_id  INTEGER REFERENCES pos_movement_lines(id) ON DELETE SET NULL,
        material_card_id  INTEGER REFERENCES material_cards(id) ON DELETE SET NULL,
        warehouse_id      INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
        batch_number      VARCHAR(100),
        quantity          NUMERIC(15,4),
        unit              VARCHAR(20),
        barcode           VARCHAR(200) NOT NULL,
        barcode_type      VARCHAR(20) DEFAULT 'CODE128',
        status            VARCHAR(20) DEFAULT 'QUEUED',
        printed_at        TIMESTAMP,
        printed_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX idx_barcode_queue_status ON pos_barcode_print_queue(status)`);
    await client.query(`CREATE INDEX idx_barcode_queue_movement ON pos_barcode_print_queue(movement_id)`);
    console.log('   ✅ pos_barcode_print_queue yaratildi');
  }

  // ─── 3. Material 360 profili uchun price_history ──────────────────────
  console.log('\n═══ 3. material_price_history (narx tarixi) ═══');
  if (!(await tableExists('material_price_history'))) {
    await client.query(`
      CREATE TABLE material_price_history (
        id               SERIAL PRIMARY KEY,
        material_card_id INTEGER NOT NULL REFERENCES material_cards(id) ON DELETE CASCADE,
        unit_price       NUMERIC(15,2) NOT NULL,
        currency         VARCHAR(3) NOT NULL DEFAULT 'UZS',
        supplier_name    TEXT,
        purchase_date    DATE,
        movement_id      INTEGER REFERENCES pos_movements(id) ON DELETE SET NULL,
        created_at       TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX idx_price_history_material ON material_price_history(material_card_id, purchase_date DESC)`);
    console.log('   ✅ material_price_history yaratildi');
  } else {
    console.log('   ⏭️  Allaqachon bor');
  }

  // ─── 4. Indekslar pos_movements va warehouse_stock uchun ──────────────
  console.log('\n═══ 4. Indekslar (tezlik uchun) ═══');
  const indexes = [
    ['idx_pos_movements_movement_type_status', `CREATE INDEX IF NOT EXISTS idx_pos_movements_movement_type_status ON pos_movements(movement_type, status)`],
    ['idx_pos_movement_lines_material',        `CREATE INDEX IF NOT EXISTS idx_pos_movement_lines_material ON pos_movement_lines(material_card_id)`],
    ['idx_warehouse_stock_material',           `CREATE INDEX IF NOT EXISTS idx_warehouse_stock_material ON warehouse_stock(material_card_id)`],
    ['idx_material_cards_category',            `CREATE INDEX IF NOT EXISTS idx_material_cards_category ON material_cards(category) WHERE is_active = true`],
  ];
  for (const [name, sql] of indexes) {
    await client.query(sql);
    console.log(`   ✅ ${name}`);
  }

  // ─── 5. Admin foydalanuvchini standart omborlarga biriktirish ─────────
  console.log('\n═══ 5. Admin ni barcha omborlarga biriktirish ═══');
  const adminRes = await client.query(`SELECT id FROM users WHERE username = 'admin' OR role = 'super_admin' LIMIT 1`);
  if (adminRes.rows.length > 0) {
    const adminId = adminRes.rows[0].id;
    const assignRes = await client.query(`
      INSERT INTO warehouse_employees (warehouse_id, user_id, role, is_primary, assigned_at)
      SELECT w.id, ${adminId}, 'manager', true, NOW()
      FROM warehouses w
      WHERE w.is_active = true
        AND w.code IN ('RM-MAIN','RM-ROLLS','FG-MAIN','WIP-MAIN','SCRAP-MAIN','QC-HOLD','TOOL-MAIN','MRO-MAIN','MRO-STORE')
        AND NOT EXISTS (
          SELECT 1 FROM warehouse_employees we
          WHERE we.warehouse_id = w.id AND we.user_id = ${adminId} AND we.removed_at IS NULL
        )
    `);
    console.log(`   ✅ Admin (id=${adminId}) ${assignRes.rowCount} ta omborga biriktirildi`);
  } else {
    console.log('   ⚠️  Admin foydalanuvchi topilmadi');
  }

  await client.query('COMMIT');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🎉 1-BOSQICH TAYYOR: DB strukturasi');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ warehouse_employees TABLE');
  console.log('  ✅ pos_barcode_print_queue (yangilangan)');
  console.log('  ✅ material_price_history TABLE');
  console.log('  ✅ 4 ta indeks (tezlik uchun)');
  console.log('  ✅ Admin barcha omborlarga manager sifatida biriktirildi');
  console.log('\nKeyingi bosqich: Backend endpointlar (avtomatik bajariladi)');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('❌ Xato:', err.message);
  console.error('   code:', err.code, 'detail:', err.detail);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
