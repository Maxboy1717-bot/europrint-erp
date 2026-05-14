/**
 * pos_inventory_passport va pos_material_passports tekshirish
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
  // Mavjud jadvallar
  for (const name of ['pos_inventory_passport', 'pos_material_passports', 'inventory_passports']) {
    console.log(`\n═══ ${name} ═══`);
    const r = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns WHERE table_name = $1
        ORDER BY ordinal_position
    `, [name]);
    if (r.rows.length === 0) {
      console.log(`   ❌ MAVJUD EMAS`);
    } else {
      for (const c of r.rows) {
        const req = c.is_nullable === 'NO' ? '🔴' : '🟢';
        console.log(`   ${req} ${c.column_name.padEnd(25)} ${c.data_type}`);
      }
    }
  }

  // users tablesi
  console.log(`\n═══ users (telegram_id, is_active uchun) ═══`);
  const u = await client.query(`
    SELECT column_name FROM information_schema.columns
     WHERE table_name = 'users' AND column_name IN ('telegram_id','is_active','role')
  `);
  for (const c of u.rows) console.log(`   ✅ ${c.column_name}`);
  if (u.rows.length === 0) console.log(`   ❌ Hech qaysi ustun yo'q`);

  // bulim ustuni qaerda?
  console.log(`\n═══ "bulim" ustuni qidirilmoqda ═══`);
  const b = await client.query(`
    SELECT table_name FROM information_schema.columns WHERE column_name = 'bulim'
  `);
  for (const t of b.rows) console.log(`   📋 ${t.table_name}.bulim`);
  if (b.rows.length === 0) console.log(`   ❌ "bulim" ustuni hech qayerda yo'q`);
} finally {
  client.release();
  await pool.end();
}
