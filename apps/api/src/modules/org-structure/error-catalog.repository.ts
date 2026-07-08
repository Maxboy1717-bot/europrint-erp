/**
 * @module error-catalog.repository
 * @description Data-access for XATO-KATALOG (`error_catalog`, T10-08, EP-ORG-097) — tipik
 *   xatolar / nuqson-sabablari ro'yxati (defect-dropdown manbai). card_id NULL = umumiy,
 *   NOT NULL = o'sha kartaga xos. Parametrized SQL, soft-delete = deleted_at IS NOT NULL.
 *   STRUKTURA T10-08 (migrations-drift APPROVED). Returns Result<T>.
 */

import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface ErrorCatalogInput {
  /** NULL = umumiy (hamma kartaga ko'rinadi); NOT NULL = o'sha kartaga xos xato. */
  cardId?: number | null;
  code?: string | null;
  name?: string;
  nameRu?: string | null;
  /** defect-guruh: sifat / deadline / material / qayta-ishlash / ... (EGASI/HR-data). */
  category?: string | null;
  severity?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}

/** Detect the active code UNIQUE partial-index violation (uq_error_catalog_code_active / 23505). */
const isUniqueCode = (e: unknown): boolean => {
  const msg = String((e as { message?: string })?.message ?? e);
  return (e as { code?: string })?.code === '23505'
    || msg.includes('uq_error_catalog_code_active')
    || msg.includes('duplicate key');
};

@Injectable()
export class ErrorCatalogRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  /**
   * Ro'yxat. `cardId` berilsa: o'sha kartaga xos + umumiy (card_id IS NULL) qaytadi
   * (operator formasi uchun to'liq dropdown). `cardId` NULL/undefined: faqat umumiy.
   * `includeArchived` true bo'lsa arxivlanganlar ham (admin boshqaruv ekrani).
   */
  async list(cardId: number | null, includeArchived: boolean): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT * FROM error_catalog
      WHERE (${includeArchived}::boolean IS TRUE OR (is_active = true AND deleted_at IS NULL))
        AND (
          (${cardId}::int IS NULL AND card_id IS NULL)
          OR (${cardId}::int IS NOT NULL AND (card_id = ${cardId}::int OR card_id IS NULL))
        )
      ORDER BY card_id NULLS FIRST, sort_order ASC, id ASC
    `);
  }

  async findById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM error_catalog WHERE id = ${id} AND deleted_at IS NULL`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async create(dto: ErrorCatalogInput, createdBy: number | null): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO error_catalog
          (card_id, code, name, name_ru, category, severity, description, sort_order, is_active, created_by, created_at, updated_at)
        VALUES
          (${dto.cardId ?? null}, ${dto.code ?? null}, ${dto.name ?? ''}, ${dto.nameRu ?? null},
           ${dto.category ?? null}, ${dto.severity ?? null}, ${dto.description ?? null},
           ${dto.sortOrder ?? 0}, true, ${createdBy ?? null}, NOW(), NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return isUniqueCode(e)
        ? Err(AppErr('CONFLICT', `'${dto.code}' kodli faol xato-katalog allaqachon mavjud`))
        : Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
    }
  }

  async update(id: number, dto: ErrorCatalogInput): Promise<Result<Row | null>> {
    try {
      // card_id: undefined = tegmaslik; null = umumiy qilish; raqam = o'sha kartaga bog'lash.
      const cardIdSql = dto.cardId === undefined ? sql`card_id` : sql`${dto.cardId}`;
      const rows = await runQuery<Row>(sql`
        UPDATE error_catalog SET
          card_id     = ${cardIdSql},
          code        = COALESCE(${dto.code ?? null}, code),
          name        = COALESCE(${dto.name ?? null}, name),
          name_ru     = COALESCE(${dto.nameRu ?? null}, name_ru),
          category    = COALESCE(${dto.category ?? null}, category),
          severity    = COALESCE(${dto.severity ?? null}, severity),
          description = COALESCE(${dto.description ?? null}, description),
          sort_order  = COALESCE(${dto.sortOrder ?? null}, sort_order),
          updated_at  = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return isUniqueCode(e)
        ? Err(AppErr('CONFLICT', `'${dto.code}' kodli faol xato-katalog allaqachon mavjud`))
        : Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
    }
  }

  /** Soft-delete (deleted_at + is_active=false). Never hard-DELETE (master-data). */
  async softDelete(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE error_catalog SET deleted_at = NOW(), is_active = false, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, code, name, is_active, deleted_at
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
