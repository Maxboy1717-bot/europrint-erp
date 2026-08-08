/**
 * @module business-settings.repo
 * @description Global biznes-sozlamalar registri (OWNER-JAVOBLAR-2026-07-11 §0/§1 — "global CRUD
 *   qoidasi"). Barcha threshold/norma/%/kun/daqiqa/summa qiymatlari kodga hardcode qilinmaydi —
 *   shu jadval orqali CRUD qilinadi. Parametrli raw SQL (runQuery) — Drizzle jadval-obyekt import
 *   qilinmaydi (barrel/dist bog''liqligidan qochish). Har metod Result<T> qaytaradi (Qoida 1/15).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof runQuery>[0]): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];

const COLS = sql`id, module, setting_key, label, value_type, value_num, value_text, unit, min_val, max_val, description, is_active, updated_by, updated_at`;

export interface BusinessSettingCreate {
  module: string;
  settingKey: string;
  label: string;
  valueType: string;
  valueNum?: number | null;
  valueText?: string | null;
  unit?: string | null;
  minVal?: number | null;
  maxVal?: number | null;
  description?: string | null;
}
export interface BusinessSettingUpdate {
  label?: string;
  valueNum?: number | null;
  valueText?: string | null;
  unit?: string | null;
  minVal?: number | null;
  maxVal?: number | null;
  description?: string | null;
  isActive?: boolean;
  updatedBy?: number | null;
}

@Injectable()
export class BusinessSettingsRepository {
  /** Ro'yxat — ixtiyoriy modul filtri; nofaol'larni default'da yashiradi. */
  async list(module: string | undefined, includeInactive: boolean) {
    try {
      const rows = await exec(sql`
        SELECT ${COLS} FROM business_settings
        WHERE (${module ?? null}::varchar IS NULL OR module = ${module ?? null})
          AND (${includeInactive} OR is_active = true)
        ORDER BY module, setting_key`);
      return Ok(rows);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  /** Bitta kalit bo'yicha (kod tomonidan o'qish uchun ham ishlatiladi). */
  async getByKey(settingKey: string) {
    try {
      const rows = await exec(sql`SELECT ${COLS} FROM business_settings WHERE setting_key = ${settingKey} LIMIT 1`);
      if (!rows[0]) return Err({ code: 'NOT_FOUND' as const, message: `Sozlama topilmadi: ${settingKey}` });
      return Ok(rows[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async create(input: BusinessSettingCreate) {
    try {
      const dup = await exec(sql`SELECT id FROM business_settings WHERE setting_key = ${input.settingKey} LIMIT 1`);
      if (dup[0]) return Err({ code: 'CONFLICT' as const, message: `Kalit band: ${input.settingKey}` });
      const r = await exec(sql`
        INSERT INTO business_settings (module, setting_key, label, value_type, value_num, value_text, unit, min_val, max_val, description)
        VALUES (${input.module}, ${input.settingKey}, ${input.label}, ${input.valueType},
                ${input.valueNum ?? null}, ${input.valueText ?? null}, ${input.unit ?? null},
                ${input.minVal ?? null}, ${input.maxVal ?? null}, ${input.description ?? null})
        RETURNING ${COLS}`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  /** Qiymatni (va metadata'ni) yangilaydi — egasi ekrandan kiritganda ishlatiladigan asosiy metod. */
  async updateByKey(settingKey: string, patch: BusinessSettingUpdate) {
    try {
      const existing = await exec(sql`SELECT id, min_val, max_val, value_type FROM business_settings WHERE setting_key = ${settingKey} LIMIT 1`);
      const cur = existing[0];
      if (!cur) return Err({ code: 'NOT_FOUND' as const, message: `Sozlama topilmadi: ${settingKey}` });
      // Chegara validatsiyasi (agar min/max belgilangan bo'lsa va yangi raqamli qiymat berilsa).
      if (patch.valueNum != null) {
        const min = patch.minVal ?? (cur.min_val != null ? Number(cur.min_val) : null);
        const max = patch.maxVal ?? (cur.max_val != null ? Number(cur.max_val) : null);
        if (min != null && patch.valueNum < min) return Err({ code: 'VALIDATION' as const, message: `Qiymat ${min} dan kichik bo'lmasin` });
        if (max != null && patch.valueNum > max) return Err({ code: 'VALIDATION' as const, message: `Qiymat ${max} dan katta bo'lmasin` });
      }
      const r = await exec(sql`
        UPDATE business_settings SET
          label       = COALESCE(${patch.label ?? null}, label),
          value_num   = COALESCE(${patch.valueNum ?? null}, value_num),
          value_text  = COALESCE(${patch.valueText ?? null}, value_text),
          unit        = COALESCE(${patch.unit ?? null}, unit),
          min_val     = COALESCE(${patch.minVal ?? null}, min_val),
          max_val     = COALESCE(${patch.maxVal ?? null}, max_val),
          description = COALESCE(${patch.description ?? null}, description),
          is_active   = COALESCE(${patch.isActive ?? null}, is_active),
          updated_by  = COALESCE(${patch.updatedBy ?? null}, updated_by),
          updated_at  = NOW()
        WHERE setting_key = ${settingKey}
        RETURNING ${COLS}`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async deleteByKey(settingKey: string) {
    try {
      const existing = await exec(sql`SELECT id FROM business_settings WHERE setting_key = ${settingKey} LIMIT 1`);
      if (!existing[0]) return Err({ code: 'NOT_FOUND' as const, message: `Sozlama topilmadi: ${settingKey}` });
      await exec(sql`DELETE FROM business_settings WHERE setting_key = ${settingKey}`);
      return Ok({ deleted: settingKey });
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }
}
