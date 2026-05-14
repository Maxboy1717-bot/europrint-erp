/**
 * Standalone seed script for pos_movement_types
 *
 * Usage:
 *   cd apps/api
 *   node scripts/seed-movement-types.mjs
 *
 * Bevosita DATABASE_URL ga ulanib:
 *   1) Yetishmagan ustunlarni qo'shadi (direction, name_ru, requires_document)
 *   2) 7 ta standart harakat turini seed qiladi
 *   3) Hammasini faollashtiradi
 *
 * Backend restart kerak emas — standalone Node.js script.
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '..', '.env') });
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL muhit o\'zgaruvchisi topilmadi!');
  process.exit(1);
}

const MOVEMENT_TYPES = [
  // direction: in | out | transfer | adjustment
  // is_issue: true agar ombordan chiqim
  // is_receipt: true agar omborga kirim
  { code: 'EXTERNAL_IN',       name: 'Tashqi Kirim',              direction: 'in',         is_issue: false, is_receipt: true  },
  { code: 'EXTERNAL_OUT',      name: 'Tashqi Chiqim',             direction: 'out',        is_issue: true,  is_receipt: false },
  { code: 'INTERNAL_ISSUE',    name: "Bo'limga Berish",           direction: 'out',        is_issue: true,  is_receipt: false },
  { code: 'INTERNAL_RETURN',   name: 'Qaytarish',                 direction: 'in',         is_issue: false, is_receipt: true  },
  { code: 'INTERNAL_TRANSFER', name: "Ombor Ko'chirish",          direction: 'transfer',   is_issue: true,  is_receipt: true  },
  { code: 'DAMAGE',            name: 'Zarar Akti',                direction: 'adjustment', is_issue: true,  is_receipt: false },
  { code: 'INVENTORY_ADJUST',  name: 'Inventarizatsiya Tuzatish', direction: 'adjustment', is_issue: false, is_receipt: false },
];

async function ensureColumn(client, table, column, definition) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  if (res.rows.length === 0) {
    console.log(`   ➕ ${column} ustuni qo'shilmoqda...`);
    await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`   ✅ ${column} qo'shildi`);
    return true;
  } else {
    console.log(`   ⏭️  ${column} allaqachon bor`);
    return false;
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔌 Ma\'lumotlar bazasiga ulanmoqda...');
    const client = await pool.connect();

    try {
      // ─── 1. Joriy struktura ──────────────────────────────────────────
      console.log('\n📋 pos_movement_types joriy strukturasi:');
      const colsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
         WHERE table_name = 'pos_movement_types'
         ORDER BY ordinal_position
      `);
      if (colsRes.rows.length === 0) {
        console.error('❌ pos_movement_types jadvali mavjud emas!');
        process.exit(1);
      }
      for (const c of colsRes.rows) {
        console.log(`   ${c.column_name.padEnd(25)} ${c.data_type.padEnd(28)} nullable=${c.is_nullable}`);
      }

      // ─── 2. Yetishmagan ustunlarni qo'shish ───────────────────────────
      console.log('\n🔧 Yetishmagan ustunlarni tekshirish va qo\'shish:');
      await ensureColumn(client, 'pos_movement_types', 'direction',
        `varchar(20) NOT NULL DEFAULT 'in' CHECK (direction IN ('in','out','transfer','adjustment'))`);
      await ensureColumn(client, 'pos_movement_types', 'name_ru', 'text');
      await ensureColumn(client, 'pos_movement_types', 'requires_document', 'boolean DEFAULT false');

      // is_issue / is_receipt ham bo'lsa, qoldiramiz (legacy uchun)
      // direction asosiy bo'ladi.

      // ─── 3. Joriy yozuvlar ───────────────────────────────────────────
      console.log('\n📊 Hozirgi yozuvlar:');
      const beforeRes = await client.query(
        'SELECT id, code, name, direction, is_active FROM pos_movement_types ORDER BY id'
      );
      console.log(`   Jami: ${beforeRes.rows.length} ta`);
      for (const r of beforeRes.rows) {
        console.log(`   - id=${r.id} | ${r.code} | ${r.name} | direction=${r.direction} | active=${r.is_active}`);
      }

      // ─── 4. Seed ─────────────────────────────────────────────────────
      console.log('\n🌱 Seed boshlanmoqda...');
      let inserted = 0, updated = 0, errors = 0;

      for (const mt of MOVEMENT_TYPES) {
        try {
          // Avval mavjudligini tekshirish
          const existsRes = await client.query(
            'SELECT id FROM pos_movement_types WHERE code = $1',
            [mt.code]
          );

          if (existsRes.rows.length > 0) {
            // Mavjud — direction va name ni yangilash (eski yozuvlarda direction NULL bo'lishi mumkin)
            const updRes = await client.query(
              `UPDATE pos_movement_types
                 SET direction = $1, name = COALESCE(name, $2), is_active = true
               WHERE code = $3`,
              [mt.direction, mt.name, mt.code]
            );
            if (updRes.rowCount > 0) {
              updated++;
              console.log(`   🔄 Yangilandi: ${mt.code} (direction=${mt.direction})`);
            }
          } else {
            // Yangi qo'shish — id SERIAL bo'lgani uchun bermay qo'yamiz
            // is_issue/is_receipt ustunlari bor bo'lsa ham qo'shamiz (legacy)
            const hasIsIssue   = colsRes.rows.some(c => c.column_name === 'is_issue');
            const hasIsReceipt = colsRes.rows.some(c => c.column_name === 'is_receipt');

            let cols = ['code', 'name', 'direction', 'is_active'];
            let vals = [mt.code, mt.name, mt.direction, true];
            let placeholders = ['$1', '$2', '$3', '$4'];

            if (hasIsIssue) {
              cols.push('is_issue');
              vals.push(mt.is_issue);
              placeholders.push(`$${vals.length}`);
            }
            if (hasIsReceipt) {
              cols.push('is_receipt');
              vals.push(mt.is_receipt);
              placeholders.push(`$${vals.length}`);
            }

            const insertSql = `INSERT INTO pos_movement_types (${cols.join(', ')})
                               VALUES (${placeholders.join(', ')})
                               RETURNING id`;
            const insRes = await client.query(insertSql, vals);
            inserted++;
            console.log(`   ✅ Qo'shildi: ${mt.code} (id=${insRes.rows[0].id})`);
          }
        } catch (err) {
          errors++;
          console.error(`   ❌ Xato ${mt.code}: ${err.message}`);
          console.error(`      code=${err.code} detail=${err.detail ?? ''} hint=${err.hint ?? ''}`);
        }
      }

      // ─── 5. Yakuniy holat ────────────────────────────────────────────
      console.log('\n📊 Yakuniy yozuvlar:');
      const afterRes = await client.query(
        'SELECT id, code, name, direction, is_active FROM pos_movement_types ORDER BY id'
      );
      for (const r of afterRes.rows) {
        const mark = r.is_active ? '✅' : '❌';
        console.log(`   ${mark} id=${r.id} | ${r.code.padEnd(20)} | ${(r.name ?? '').padEnd(25)} | ${r.direction}`);
      }

      console.log('\n═══════════════════════════════════════════════════');
      console.log(`📈 Natija: ${inserted} ta qo'shildi, ${updated} ta yangilandi, ${errors} ta xato`);
      console.log(`📦 Bazada jami: ${afterRes.rows.length} ta harakat turi`);
      console.log('═══════════════════════════════════════════════════');

      if (errors === 0 && afterRes.rows.length >= 7) {
        console.log('\n🎉 MUVAFFAQIYAT! "Karantinga yuborish" endi ishlaydi.');
        console.log('   Brauzerda POS Monitor ni qayta yuklang (F5) va sinab ko\'ring.');
      } else if (errors > 0) {
        console.log('\n⚠️  Xatolar bor — yuqoridagi matnlarni menga yuboring.');
        process.exit(1);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Asosiy xato:', err.message);
    console.error('   code:', err.code);
    console.error('   detail:', err.detail);
    console.error('   stack:', err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
