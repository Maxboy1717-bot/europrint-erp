/**
 * Ortiqcha omborlarni tozalash.
 * - Harakati/stoki yo'q → to'liq DELETE
 * - Harakati/stoki bor  → is_active = false (xavfsiz)
 *
 * Kerakli 9 ta ombor (o'zgarishsiz qoladi):
 *   Asbob-Uskuna Ombori · Brak Ombori · Karantin Ombori
 *   MRO Ombori · Rulon Ombori · Tayyor Mahsulot Ombori
 *   Xo'jalik Ombori · Xom Ashyo Ombori · Yarim Tayyor Mahsulot
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

const KEEP = [
  "Asbob-Uskuna Ombori",
  "Brak Ombori",
  "Karantin Ombori",
  "MRO Ombori",
  "Rulon Ombori",
  "Tayyor Mahsulot Ombori",
  "Xo'jalik Ombori",
  "Xom Ashyo Ombori",
  "Yarim Tayyor Mahsulot",
];

try {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🗑️  Ortiqcha omborlarni tozalash');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1) Kerakli 9 ni aktivlashtir
  const keepPlaceholders = KEEP.map((_, i) => `$${i + 1}`).join(', ');
  await client.query(
    `UPDATE warehouses SET is_active = true WHERE name IN (${keepPlaceholders})`,
    KEEP
  );

  // 2) Ortiqcha omborlarni topish
  const extraR = await client.query(
    `SELECT id, code, name FROM warehouses WHERE name NOT IN (${keepPlaceholders})`,
    KEEP
  );
  console.log(`📋 O'chirish/deaktivatsiya qilinadigan omborlar: ${extraR.rows.length} ta\n`);

  let deleted = 0;
  let deactivated = 0;

  for (const wh of extraR.rows) {
    // Harakatlar bormi?
    const movR = await client.query(
      `SELECT COUNT(*) AS cnt FROM pos_movements
       WHERE from_warehouse_id = $1 OR to_warehouse_id = $1`,
      [wh.id]
    );
    // Stok bormi?
    const stkR = await client.query(
      `SELECT COUNT(*) AS cnt FROM warehouse_stock
       WHERE warehouse_id = $1 AND quantity > 0`,
      [wh.id]
    );

    const hasMov = Number(movR.rows[0].cnt) > 0;
    const hasStk = Number(stkR.rows[0].cnt) > 0;

    if (hasMov || hasStk) {
      // Xavfsiz: faqat deaktivatsiya
      await client.query(
        `UPDATE warehouses SET is_active = false WHERE id = $1`, [wh.id]
      );
      console.log(`  ⚠️  DEAKTIV: "${wh.name}" (${wh.code}) — mov=${movR.rows[0].cnt}, stk=${stkR.rows[0].cnt}`);
      deactivated++;
    } else {
      // Bo'sh → to'liq o'chirish
      await client.query(`DELETE FROM warehouse_zones WHERE warehouse_id = $1`, [wh.id]);
      await client.query(`DELETE FROM warehouse_stock  WHERE warehouse_id = $1`, [wh.id]);
      await client.query(`DELETE FROM warehouses       WHERE id = $1`, [wh.id]);
      console.log(`  🗑️  DELETED: "${wh.name}" (${wh.code})`);
      deleted++;
    }
  }

  // 3) Yakuniy holat
  const finalR = await client.query(
    `SELECT code, name, is_active FROM warehouses ORDER BY name`
  );
  const active   = finalR.rows.filter(w => w.is_active);
  const inactive = finalR.rows.filter(w => !w.is_active);

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`✅ O'chirildi:    ${deleted} ta`);
  console.log(`⚠️  Deaktiv:      ${deactivated} ta`);
  console.log(`\n📊 Aktiv omborlar (${active.length} ta):`);
  for (const w of active) {
    console.log(`   ✅ ${w.name} (${w.code})`);
  }
  if (inactive.length > 0) {
    console.log(`\n📊 Inaktiv omborlar (${inactive.length} ta) — ko'rinmaydi:`);
    for (const w of inactive) {
      console.log(`   ❌ ${w.name} (${w.code})`);
    }
  }
  console.log('\n🎉 Tayyor! Sahifani yangilang.');
} catch (err) {
  console.error('❌ Xato:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
