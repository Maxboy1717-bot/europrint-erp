/**
 * Karantin workflow diagnostika va tuzatish.
 *
 * Tekshiradi:
 *   1. QC-HOLD ombor mavjudmi?
 *   2. RM-MAIN ombor mavjudmi?
 *   3. warehouse_stock jadval UNIQUE constraint bormi?
 *   4. Recent EXTERNAL_IN movements va stok holati
 *   5. Agar stok yo'q bo'lsa — qo'lda qayta qo'shadi
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
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 Karantin workflow diagnostika');
  console.log('═══════════════════════════════════════════════════\n');

  // 1) QC-HOLD ombor
  const qcR = await client.query(`SELECT id, code, name, is_active FROM warehouses WHERE code = 'QC-HOLD'`);
  if (qcR.rows.length === 0) {
    console.log('❌ QC-HOLD ombor MAVJUD EMAS!');
    console.log('   Yaratish kerak: node scripts/setup-full-warehouse-system.mjs');
    process.exit(1);
  }
  const qcWh = qcR.rows[0];
  console.log(`✅ QC-HOLD ombor: id=${qcWh.id}, active=${qcWh.is_active}`);

  // 2) RM-MAIN ombor
  const rmR = await client.query(`SELECT id, code, name, is_active FROM warehouses WHERE code = 'RM-MAIN'`);
  if (rmR.rows.length === 0) {
    console.log('❌ RM-MAIN ombor MAVJUD EMAS!');
    process.exit(1);
  }
  const rmWh = rmR.rows[0];
  console.log(`✅ RM-MAIN ombor: id=${rmWh.id}, active=${rmWh.is_active}`);

  // 3) warehouse_stock UNIQUE constraint
  const uniqR = await client.query(`
    SELECT 1 FROM pg_constraint WHERE conname = 'warehouse_stock_wh_mat_uniq'
  `);
  if (uniqR.rows.length === 0) {
    console.log('⚠️  UNIQUE constraint yo\'q — qo\'shilmoqda...');
    try {
      // Avval duplicate larni tozalash
      await client.query(`
        DELETE FROM warehouse_stock ws
        USING (
          SELECT warehouse_id, material_card_id, MIN(id) AS keep_id
          FROM warehouse_stock GROUP BY warehouse_id, material_card_id HAVING COUNT(*) > 1
        ) d
        WHERE ws.warehouse_id = d.warehouse_id
          AND ws.material_card_id = d.material_card_id
          AND ws.id <> d.keep_id
      `);
      await client.query(`
        ALTER TABLE warehouse_stock
        ADD CONSTRAINT warehouse_stock_wh_mat_uniq UNIQUE (warehouse_id, material_card_id)
      `);
      console.log('✅ UNIQUE constraint qo\'shildi');
    } catch (e) {
      console.log(`⚠️  Constraint qo'shilmadi: ${e.message}`);
    }
  } else {
    console.log('✅ UNIQUE constraint bor');
  }

  // 4) Recent EXTERNAL_IN movements
  console.log('\n📋 Oxirgi 10 ta EXTERNAL_IN harakat:');
  const movsR = await client.query(`
    SELECT pm.id, pm.movement_number, pm.status, pm.to_warehouse_id, pm.created_at,
           (SELECT COUNT(*) FROM pos_movement_lines WHERE movement_id = pm.id)::int AS line_count,
           (SELECT COUNT(*) FROM warehouse_stock ws JOIN pos_movement_lines pml ON ws.material_card_id = pml.material_card_id
              WHERE pml.movement_id = pm.id AND ws.warehouse_id = pm.to_warehouse_id)::int AS stock_entries
    FROM pos_movements pm
    WHERE pm.movement_type = 'EXTERNAL_IN'
    ORDER BY pm.created_at DESC
    LIMIT 10
  `);
  for (const m of movsR.rows) {
    console.log(`   ${m.movement_number} | status=${m.status} | to_wh=${m.to_warehouse_id} | lines=${m.line_count} | stok=${m.stock_entries}`);
  }

  // 5) Stok yo'q EXTERNAL_IN larni qayta tuzatish
  console.log('\n🔧 Stok kiritilmagan EXTERNAL_IN larni tuzatish:');
  const fixR = await client.query(`
    SELECT pm.id, pm.movement_number, pm.to_warehouse_id, pm.status
    FROM pos_movements pm
    WHERE pm.movement_type = 'EXTERNAL_IN'
      AND pm.status IN ('karantin', 'qc_review', 'pending', 'draft')
      AND pm.to_warehouse_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM pos_movement_lines WHERE movement_id = pm.id)
      AND NOT EXISTS (
        SELECT 1 FROM warehouse_stock ws
        JOIN pos_movement_lines pml ON ws.material_card_id = pml.material_card_id
        WHERE pml.movement_id = pm.id AND ws.warehouse_id = pm.to_warehouse_id
      )
  `);
  console.log(`   Stok kiritilmagan: ${fixR.rows.length} ta movement`);

  let fixedCount = 0;
  for (const m of fixR.rows) {
    const linesR = await client.query(`
      SELECT material_card_id, quantity::numeric AS quantity, unit
      FROM pos_movement_lines WHERE movement_id = $1
    `, [m.id]);
    for (const line of linesR.rows) {
      const qty = Number(line.quantity);
      if (qty <= 0) continue;
      try {
        await client.query(`
          INSERT INTO warehouse_stock (warehouse_id, material_card_id, quantity, reserved_quantity, available_quantity, unit_of_measure, last_updated_at, created_at)
          VALUES ($1, $2, $3, 0, $3, $4, NOW(), NOW())
          ON CONFLICT (warehouse_id, material_card_id)
          DO UPDATE SET
            quantity = warehouse_stock.quantity + EXCLUDED.quantity,
            available_quantity = warehouse_stock.available_quantity + EXCLUDED.quantity,
            last_updated_at = NOW()
        `, [m.to_warehouse_id, line.material_card_id, qty, line.unit ?? null]);
      } catch (e) {
        console.log(`   ⚠️ ${m.movement_number} line err: ${e.message}`);
      }
    }
    console.log(`   ✅ ${m.movement_number} (${linesR.rows.length} qator) qayta kiritildi`);
    fixedCount++;
  }

  console.log(`\n🎉 ${fixedCount} ta movement uchun stok kiritildi`);

  // 6) Yakuniy stok holati har omborda
  console.log('\n📊 Har omborda stok summa:');
  const statR = await client.query(`
    SELECT w.code, w.name,
           COUNT(DISTINCT ws.material_card_id)::int AS material_count,
           COALESCE(SUM(ws.available_quantity), 0)::numeric AS total_qty
    FROM warehouses w
    LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
    WHERE w.is_active = true
    GROUP BY w.id, w.code, w.name
    ORDER BY w.code
  `);
  for (const w of statR.rows) {
    console.log(`   ${w.code.padEnd(12)} | ${w.name.padEnd(25)} | materials=${w.material_count.toString().padStart(3)} | qty=${Number(w.total_qty).toFixed(2)}`);
  }
} catch (err) {
  console.error('❌ Xato:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
