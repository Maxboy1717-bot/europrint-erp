/**
 * @module card-template.repository
 * @description Data-access for KARTA shabloni (`card_templates`) — lavozim-turi bo'yicha
 *   standart KARTA-maydon qiymatlari (`field_defaults` JSONB). Yangi org_departments
 *   kartasini urug'lash uchun shablon. Parametrized SQL, soft-delete = deleted_at IS NOT NULL.
 *   STRUKTURA T10-03 (migrations-drift APPROVED). Returns Result<T>.
 */

import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export interface CardTemplateInput {
  positionType?: string;
  name?: string;
  nameRu?: string | null;
  description?: string | null;
  /** Standart KARTA-maydon qiymatlari (positionName/razryadLevelId/salaryType/... ixtiyoriy). EGASI-DATA. */
  fieldDefaults?: Record<string, unknown> | null;
}

/** Detect the active position_type UNIQUE partial-index violation (uq_card_templates_position_type_active / 23505). */
const isUniquePositionType = (e: unknown): boolean => {
  const msg = String((e as { message?: string })?.message ?? e);
  return (e as { code?: string })?.code === '23505'
    || msg.includes('uq_card_templates_position_type_active')
    || msg.includes('duplicate key');
};

@Injectable()
export class CardTemplateRepository {
  private exec(q: SQL | SQLWrapper): Promise<Result<Row[]>> {
    return safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
  }

  async list(includeArchived: boolean): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT * FROM card_templates
      WHERE (${includeArchived}::boolean IS TRUE OR (is_active = true AND deleted_at IS NULL))
      ORDER BY position_type ASC, id ASC
    `);
  }

  async findById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`SELECT * FROM card_templates WHERE id = ${id} AND deleted_at IS NULL`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async create(dto: CardTemplateInput, createdBy: number | null): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO card_templates
          (position_type, name, name_ru, description, field_defaults, is_active, created_by, created_at, updated_at)
        VALUES
          (${dto.positionType ?? ''}, ${dto.name ?? ''}, ${dto.nameRu ?? null}, ${dto.description ?? null},
           ${JSON.stringify(dto.fieldDefaults ?? {})}::jsonb, true, ${createdBy ?? null}, NOW(), NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return isUniquePositionType(e)
        ? Err(AppErr('CONFLICT', `'${dto.positionType}' lavozim-turi uchun faol shablon allaqachon mavjud`))
        : Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
    }
  }

  async update(id: number, dto: CardTemplateInput): Promise<Result<Row | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE card_templates SET
          position_type  = COALESCE(${dto.positionType ?? null}, position_type),
          name           = COALESCE(${dto.name ?? null}, name),
          name_ru        = COALESCE(${dto.nameRu ?? null}, name_ru),
          description    = COALESCE(${dto.description ?? null}, description),
          field_defaults = COALESCE(${dto.fieldDefaults ? JSON.stringify(dto.fieldDefaults) : null}::jsonb, field_defaults),
          updated_at     = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e) {
      return isUniquePositionType(e)
        ? Err(AppErr('CONFLICT', `'${dto.positionType}' lavozim-turi uchun faol shablon allaqachon mavjud`))
        : Err(AppErr('INTERNAL', String((e as Error)?.message ?? e)));
    }
  }

  /** Soft-delete (deleted_at + is_active=false). Never hard-DELETE (master-data). */
  async softDelete(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      UPDATE card_templates SET deleted_at = NOW(), is_active = false, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, position_type, is_active, deleted_at
    `);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
