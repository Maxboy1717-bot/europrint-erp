/**
 * @module drizzle-pp-reason-codes.repo
 * @description Drizzle implementation of the PP reason-code catalog port. pp_reason_codes
 *   is a migration-added table (pp-reason-codes-shift-plans-2026-07-08.sql) not mirrored in
 *   the Drizzle schema barrel — so, like the sibling reason_code_id write in
 *   drizzle-pp-production-orders.repo.ts, it is read/written through parameterised runQuery
 *   (Rule B: no sql.raw of a variable; every value is bound). All list/mutation methods
 *   return Result<T> and guard rows with Array.isArray.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpReasonCodesRepo,
  PpReasonCodeRow,
  CreatePpReasonCodeInput,
  UpdatePpReasonCodeInput,
} from './i-pp-reason-codes.repo';

/** Raw DB row shape (snake_case) before mapping to the camelCase API view. */
interface PpReasonCodeDbRow {
  id: number | string;
  code: string;
  name: string;
  name_ru: string | null;
  category: string;
  color: string | null;
  is_active: boolean;
  sort_order: number | string;
}

function mapRow(row: PpReasonCodeDbRow): PpReasonCodeRow {
  return {
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    nameRu: row.name_ru != null ? String(row.name_ru) : null,
    category: String(row.category),
    color: row.color != null ? String(row.color) : null,
    isActive: row.is_active === true,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

@Injectable()
export class DrizzlePpReasonCodesRepository implements IPpReasonCodesRepo {
  async findActive(): Promise<Result<PpReasonCodeRow[]>> {
    try {
      const r = await runQuery<PpReasonCodeDbRow>(sql`
        SELECT id, code, name, name_ru, category, color, is_active, sort_order
        FROM pp_reason_codes
        WHERE is_active = true
        ORDER BY sort_order, id`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map(mapRow));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Sabab kodlarini o'qishda xatolik"));
    }
  }

  async create(dto: CreatePpReasonCodeInput): Promise<Result<PpReasonCodeRow>> {
    try {
      // is_active omitted from the column list → DB default TRUE.
      // color falls back to the DB default '#808080' when not supplied.
      const r = await runQuery<PpReasonCodeDbRow>(sql`
        INSERT INTO pp_reason_codes (code, name, name_ru, category, color, sort_order)
        VALUES (
          ${dto.code},
          ${dto.name},
          ${dto.name_ru ?? null},
          ${dto.category},
          COALESCE(${dto.color ?? null}, '#808080'),
          ${dto.sort_order ?? 0}
        )
        RETURNING id, code, name, name_ru, category, color, is_active, sort_order`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Err(AppErr('DB_ERROR', 'Sabab kodi yaratilmadi'));
      return Ok(mapRow(row));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Sabab kodini yaratishda xatolik');
    }
  }

  async update(id: number, patch: UpdatePpReasonCodeInput): Promise<Result<PpReasonCodeRow | null>> {
    try {
      // COALESCE(param, column): a param is applied only when provided (non-null),
      // so an omitted field keeps its current value and category/is_active are never
      // nulled. is_active=false is preserved (false ?? null === false → deactivate).
      const r = await runQuery<PpReasonCodeDbRow>(sql`
        UPDATE pp_reason_codes SET
          name       = COALESCE(${patch.name ?? null}, name),
          name_ru    = COALESCE(${patch.name_ru ?? null}, name_ru),
          category   = COALESCE(${patch.category ?? null}, category),
          color      = COALESCE(${patch.color ?? null}, color),
          sort_order = COALESCE(${patch.sort_order ?? null}, sort_order),
          is_active  = COALESCE(${patch.is_active ?? null}, is_active)
        WHERE id = ${id}
        RETURNING id, code, name, name_ru, category, color, is_active, sort_order`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Sabab kodini yangilashda xatolik');
    }
  }
}
