/**
 * @module taxonomy.repo
 * @description §2 Taksonomiya (nomli ro'yxatlar) registri — OWNER-JAVOBLAR-2026-07-11.
 *   Mahsulot turi / chegirma / bezash / qadoqlash / aloqa turi / hujjat turi va boshqalar.
 *   Parametrli raw SQL (runQuery, jadval-obyekt import qilinmaydi), har metod Result<T> (Qoida 1/15).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof runQuery>[0]): Promise<Row[]> =>
  (await runQuery<Row>(q)).rows as Row[];
const COLS = sql`id, category, code, name_uz, name_ru, sort_order, is_active, attrs, description`;

export interface TaxonomyCreate {
  category: string; code: string; nameUz: string; nameRu?: string | null;
  sortOrder?: number; attrs?: unknown; description?: string | null;
}
export interface TaxonomyUpdate {
  nameUz?: string; nameRu?: string | null; sortOrder?: number;
  isActive?: boolean; attrs?: unknown; description?: string | null;
}

@Injectable()
export class TaxonomyRepository {
  /** Kategoriyalar ro'yxati (nechta yozuvi bor). */
  async listCategories() {
    try {
      const rows = await exec(sql`
        SELECT category, COUNT(*)::int AS entry_count,
               COUNT(*) FILTER (WHERE is_active)::int AS active_count
        FROM taxonomy_entries GROUP BY category ORDER BY category`);
      return Ok(rows);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  /** Bir kategoriya yozuvlari. */
  async list(category: string, includeInactive: boolean) {
    try {
      const rows = await exec(sql`
        SELECT ${COLS} FROM taxonomy_entries
        WHERE category = ${category} AND (${includeInactive} OR is_active = true)
        ORDER BY sort_order, id`);
      return Ok(rows);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async create(input: TaxonomyCreate) {
    try {
      const dup = await exec(sql`SELECT id FROM taxonomy_entries WHERE category = ${input.category} AND code = ${input.code} LIMIT 1`);
      if (dup[0]) return Err({ code: 'CONFLICT' as const, message: `Kod band: ${input.category}/${input.code}` });
      const r = await exec(sql`
        INSERT INTO taxonomy_entries (category, code, name_uz, name_ru, sort_order, attrs, description)
        VALUES (${input.category}, ${input.code}, ${input.nameUz}, ${input.nameRu ?? null},
                ${input.sortOrder ?? 0}, ${input.attrs != null ? sql`${JSON.stringify(input.attrs)}::jsonb` : null}, ${input.description ?? null})
        RETURNING ${COLS}`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async update(id: number, patch: TaxonomyUpdate) {
    try {
      const existing = await exec(sql`SELECT id FROM taxonomy_entries WHERE id = ${id} LIMIT 1`);
      if (!existing[0]) return Err({ code: 'NOT_FOUND' as const, message: 'Yozuv topilmadi' });
      const r = await exec(sql`
        UPDATE taxonomy_entries SET
          name_uz     = COALESCE(${patch.nameUz ?? null}, name_uz),
          name_ru     = COALESCE(${patch.nameRu ?? null}, name_ru),
          sort_order  = COALESCE(${patch.sortOrder ?? null}, sort_order),
          is_active   = COALESCE(${patch.isActive ?? null}, is_active),
          attrs       = COALESCE(${patch.attrs != null ? sql`${JSON.stringify(patch.attrs)}::jsonb` : null}, attrs),
          description = COALESCE(${patch.description ?? null}, description),
          updated_at  = NOW()
        WHERE id = ${id}
        RETURNING ${COLS}`);
      return Ok(r[0]);
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }

  async remove(id: number) {
    try {
      const existing = await exec(sql`SELECT id FROM taxonomy_entries WHERE id = ${id} LIMIT 1`);
      if (!existing[0]) return Err({ code: 'NOT_FOUND' as const, message: 'Yozuv topilmadi' });
      await exec(sql`DELETE FROM taxonomy_entries WHERE id = ${id}`);
      return Ok({ deleted: id });
    } catch (e) { return Err({ code: 'DB_ERROR' as const, message: String(e) }); }
  }
}
