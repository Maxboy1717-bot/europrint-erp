/**
 * warehouse_stock jadval uchun UNIQUE constraint qo'shish.
 * ON CONFLICT bilan ishlashi uchun.
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  console.log('🔍 warehouse_stock UNIQUE constraint qo\'shilmoqda...');

  // Avval mavjudligini tekshirish
  const existsR = await client.query(`
    SELECT 1 FROM pg_constraint
     WHERE conname = 'warehouse_stock_wh_mat_uniq'
  `);
  if (existsR.rows.length > 0) {
    console.log('⏭️  UNIQUE constraint allaqachon bor');
  } else {
    // Avval duplicate larni birlashtirish
    console.log('🧹 Duplikatlarni tozalash...');
    await client.query(`
      WITH duplicates AS (
        SELECT warehouse_id, material_card_id,
               MIN(id) AS keep_id,
               SUM(quantity) AS total_qty,
               SUM(reserved_quantity) AS total_reserved,
               SUM(available_quantity) AS total_available
        FROM warehouse_stock
        GROUP BY warehouse_id, material_card_id
        HAVING COUNT(*) > 1
      )
      UPDATE warehouse_stock ws
         SET quantity = d.total_qty,
             reserved_quantity = d.total_reserved,
             available_quantity = d.total_available
      FROM duplicates d
      WHERE ws.id = d.keep_id
    `);
    await client.query(`
      DELETE FROM warehouse_stock ws
      USING (
        SELECT warehouse_id, material_card_id, MIN(id) AS keep_id
        FROM warehouse_stock
        GROUP BY warehouse_id, material_card_id
        HAVING COUNT(*) > 1
      ) d
      WHERE ws.warehouse_id = d.warehouse_id
        AND ws.material_card_id = d.material_card_id
        AND ws.id <> d.keep_id
    `);

    // UNIQUE constraint qo'shish
    await client.query(`
      ALTER TABLE warehouse_stock
      ADD CONSTRAINT warehouse_stock_wh_mat_uniq UNIQUE (warehouse_id, material_card_id)
    `);
    console.log('✅ UNIQUE (warehouse_id, material_card_id) qo\'shildi');
  }

  console.log('🎉 Tayyor! Endi UPSERT (ON CONFLICT) ishlaydi');
} catch (err) {
  console.error('❌ Xato:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
