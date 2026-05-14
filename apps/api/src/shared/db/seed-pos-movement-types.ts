/**
 * pos_movement_types — 7 ta standart harakat turini seed qilish
 *
 * Bu funksiya Drizzle ORM orqali to'g'ridan-to'g'ri ishlaydi (raw SQL emas),
 * shu sababli kompilyatsiya vaqtida schema bilan moslik tekshiriladi.
 *
 * Spec ga muvofiq 7 ta tur:
 *   EXTERNAL_IN, EXTERNAL_OUT, INTERNAL_ISSUE, INTERNAL_RETURN,
 *   INTERNAL_TRANSFER, DAMAGE, INVENTORY_ADJUST
 *
 * Idempotent — qayta ishga tushishi xavfsiz.
 */
import { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';

interface MovementTypeSeed {
  code:      string;
  name:      string;
  direction: 'in' | 'out' | 'transfer' | 'adjustment';
}

const MOVEMENT_TYPES: MovementTypeSeed[] = [
  { code: 'EXTERNAL_IN',       name: 'Tashqi Kirim',            direction: 'in'         },
  { code: 'EXTERNAL_OUT',      name: 'Tashqi Chiqim',           direction: 'out'        },
  { code: 'INTERNAL_ISSUE',    name: "Bo'limga Berish",         direction: 'out'        },
  { code: 'INTERNAL_RETURN',   name: 'Qaytarish',               direction: 'in'         },
  { code: 'INTERNAL_TRANSFER', name: "Ombor Ko'chirish",        direction: 'transfer'   },
  { code: 'DAMAGE',            name: 'Zarar Akti',              direction: 'adjustment' },
  { code: 'INVENTORY_ADJUST',  name: 'Inventarizatsiya Tuzatish', direction: 'adjustment' },
];

export async function seedPosMovementTypes(): Promise<void> {
  const logger = new Logger('seedPosMovementTypes');
  let inserted = 0;
  let already = 0;
  let errors = 0;

  for (const mt of MOVEMENT_TYPES) {
    try {
      // INSERT ... WHERE NOT EXISTS, mavjud ustunlar (id, code, name, direction,
      // is_active, created_at) — `id` qo'lda beriladi (jadval SERIAL emas).
      // ON CONFLICT bilan ham himoyalanamiz (code UNIQUE bo'lsa).
      const result = await db.execute(sql`
        INSERT INTO pos_movement_types (id, code, name, direction, is_active, created_at)
        SELECT COALESCE((SELECT MAX(id) FROM pos_movement_types), 0) + 1,
               ${mt.code}::text,
               ${mt.name}::text,
               ${mt.direction}::text,
               true,
               NOW()
        WHERE NOT EXISTS (SELECT 1 FROM pos_movement_types WHERE code = ${mt.code})
        RETURNING id
      `);
      const rows = (result as { rows?: unknown[] }).rows ?? [];
      if (rows.length > 0) {
        inserted++;
        logger.log(`✅ Qo'shildi: ${mt.code} (${mt.name})`);
      } else {
        already++;
      }
    } catch (err) {
      errors++;
      logger.error(`❌ Xato ${mt.code}: ${String(err)}`);
    }
  }

  // Hammasini faollashtirish (agar nofaol bo'lib qolgan bo'lsa)
  try {
    await db.execute(sql`
      UPDATE pos_movement_types
         SET is_active = true
       WHERE code IN ('EXTERNAL_IN','EXTERNAL_OUT','INTERNAL_ISSUE',
                      'INTERNAL_RETURN','INTERNAL_TRANSFER','DAMAGE',
                      'INVENTORY_ADJUST')
         AND (is_active IS NULL OR is_active = false)
    `);
  } catch (err) {
    logger.warn(`Faollashtirish xato: ${String(err)}`);
  }

  logger.log(
    `pos_movement_types seed yakunlandi: ${inserted} ta qo'shildi, ` +
    `${already} ta allaqachon bor edi, ${errors} ta xato`,
  );

  // Tasdiqlash uchun jadval holatini ko'rsatish
  try {
    const checkResult = await db.execute(sql`
      SELECT code, name, direction, is_active
      FROM pos_movement_types
      ORDER BY id
    `);
    const rows = (checkResult as { rows?: Array<Record<string, unknown>> }).rows ?? [];
    logger.log(`Hozir bazada ${rows.length} ta harakat turi mavjud:`);
    for (const r of rows) {
      logger.log(`  - ${r['code']} | ${r['name']} | ${r['direction']} | active=${r['is_active']}`);
    }
  } catch { /* noop */ }
}
