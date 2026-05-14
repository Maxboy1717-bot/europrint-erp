/**
 * Diagnostic script for pos_movements / pos_movement_lines table schema
 *
 * Usage: node scripts/diagnose-movements.mjs
 *
 * Backend 500 xatosini topish uchun jadvallar strukturasini ko'rsatadi.
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

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const tables = [
      'pos_movements',
      'pos_movement_lines',
      'pos_movement_types',
      'warehouses',
      'material_cards',
    ];

    for (const table of tables) {
      console.log(`\n═══════════════════════════════════════════════════`);
      console.log(`📋 ${table} jadval strukturasi:`);
      console.log(`═══════════════════════════════════════════════════`);

      // Ustunlar
      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position
      `, [table]);

      if (colsRes.rows.length === 0) {
        console.log(`   ❌ JADVAL MAVJUD EMAS!`);
        continue;
      }

      for (const c of colsRes.rows) {
        const req = c.is_nullable === 'NO' ? '🔴 NOT NULL' : '🟢 NULL OK';
        const def = c.column_default ? ` default=${c.column_default.substring(0, 40)}` : '';
        console.log(`   ${c.column_name.padEnd(28)} ${c.data_type.padEnd(28)} ${req}${def}`);
      }

      // Constraints
      const constRes = await client.query(`
        SELECT con.conname AS name,
               con.contype AS type,
               pg_get_constraintdef(con.oid) AS definition
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
         WHERE rel.relname = $1
         ORDER BY con.contype
      `, [table]);

      if (constRes.rows.length > 0) {
        console.log(`\n   📌 Constraints:`);
        for (const c of constRes.rows) {
          const typeNames = { p: 'PRIMARY KEY', f: 'FOREIGN KEY', u: 'UNIQUE', c: 'CHECK', n: 'NOT NULL' };
          const typeName = typeNames[c.type] || c.type;
          console.log(`   - [${typeName}] ${c.name}: ${c.definition.substring(0, 100)}`);
        }
      }

      // Misol yozuvlar
      try {
        const sampleRes = await client.query(`SELECT * FROM ${table} ORDER BY 1 LIMIT 2`);
        if (sampleRes.rows.length > 0) {
          console.log(`\n   📊 Misol yozuvlar (${sampleRes.rows.length} ta):`);
          for (const r of sampleRes.rows) {
            const compact = Object.entries(r)
              .filter(([_k, v]) => v !== null && v !== undefined)
              .map(([k, v]) => `${k}=${String(v).substring(0, 30)}`)
              .join(', ');
            console.log(`   - ${compact.substring(0, 200)}`);
          }
        } else {
          console.log(`\n   📊 Jadval bo'sh`);
        }
      } catch (err) {
        console.log(`\n   ⚠️  SELECT xato: ${err.message}`);
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('🔍 DIAGNOSTIKA YAKUNI');
    console.log('═══════════════════════════════════════════════════');
    console.log('Yuqoridagi ustunlar va constraintlarni tahlil qilamiz.');
    console.log('Agar biror NOT NULL ustun bo\'lib, kod uni yubormasa — 500 chiqadi.');
  } catch (err) {
    console.error('❌ Asosiy xato:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
