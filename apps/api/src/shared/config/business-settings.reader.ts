/**
 * @module business-settings.reader
 * @description Umumiy (cross-module) o'qish yordamchisi — istalgan servis/cron biznes-sozlama
 *   qiymatini kodga hardcode qilmasdan shu yerdan oladi ("global CRUD qoidasi",
 *   OWNER-JAVOBLAR-2026-07-11). Boshqaruv (CRUD) admin modulida; bu faqat READ (shared-read
 *   qoidasi — MODUL_SHARTNOMASI). HECH QACHON throw qilmaydi: sozlama yo'q/nofaol/DB xatosida
 *   fallback qaytaradi, shuning uchun ishlayotgan yo'llar buzilmaydi (Q-39 regressiyasiz migratsiya).
 */

import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

/** Raqamli biznes-sozlama (faol bo'lsa) yoki fallback. */
export async function getBusinessSettingNumber(key: string, fallback: number): Promise<number> {
  try {
    const r = await runQuery<{ value_num: string | null; is_active: boolean }>(
      sql`SELECT value_num, is_active FROM business_settings WHERE setting_key = ${key} LIMIT 1`,
    );
    const row = r.rows[0];
    if (!row || row.is_active === false || row.value_num == null) return fallback;
    const n = Number(row.value_num);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

/** Matnli biznes-sozlama (faol bo'lsa) yoki fallback. */
export async function getBusinessSettingText(key: string, fallback: string): Promise<string> {
  try {
    const r = await runQuery<{ value_text: string | null; is_active: boolean }>(
      sql`SELECT value_text, is_active FROM business_settings WHERE setting_key = ${key} LIMIT 1`,
    );
    const row = r.rows[0];
    if (!row || row.is_active === false || row.value_text == null) return fallback;
    return String(row.value_text);
  } catch {
    return fallback;
  }
}
