/**
 * NOTE: Raw SQL retained intentionally — parallel count+data fetch on the
 *   Bitrix-style crm_deals table (live columns: date_create/date_modify,
 *   stage_semantic_id, currency_id, close_date, additional_info, comments;
 *   lead link in metadata jsonb) whose mapping is fully owned by this repo
 *   (no Drizzle schema binding).
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module drizzle-crm-deals.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import { ICrmDealsRepository } from './i-crm-deals.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleCrmDealsRepository implements ICrmDealsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countRes, dataRes] = await Promise.all([
        runQuery<{ c: string }>(sql`SELECT count(*)::text AS c FROM crm_deals WHERE deleted_at IS NULL`),
        runQuery<Row>(sql`
          SELECT * FROM crm_deals
          WHERE deleted_at IS NULL
          ORDER BY date_create DESC
          LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return Ok({ data: dataRes.rows, count: Number(countRes.rows[0]?.c || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bitimlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<Row | null>> {
    try {
      const res = await runQuery<Row>(sql`
        SELECT * FROM crm_deals WHERE id = ${id} AND deleted_at IS NULL LIMIT 1
      `);
      return Ok(res.rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Bitim #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Row>> {
    try {
      const title               = String(dto.title ?? '');
      const stageId             = String(dto.stageId ?? dto.stage_id ?? 'C0:NEW');
      const companyId           = Number(dto.companyId ?? dto.company_id) || null;
      const opportunity         = String(dto.opportunity ?? dto.amount ?? '0');
      const assignedById        = Number(dto.assignedById ?? dto.assigned_by_id ?? dto.assignedTo ?? createdBy) || null;
      const createdById         = Number(createdBy ?? dto.createdById ?? dto.created_by_id) || null;
      const probability         = Number(dto.probability) || 0;
      const currency            = String(dto.currency ?? 'UZS');
      const expectedClosureDate = (dto.expectedClosureDate ?? dto.expected_closure_date) != null
        ? String(dto.expectedClosureDate ?? dto.expected_closure_date)
        : null;
      const description         = dto.description != null ? String(dto.description) : null;
      const leadId              = Number(dto.leadId ?? dto.lead_id) || null;

      // Live crm_deals columns: currency_id (not currency), close_date (not
      // expected_closure_date), additional_info (not description); no lead_id column
      // (lead link → metadata jsonb).
      // crm_deals is a VIEW over `deals`; base `amount` is NOT NULL while the insert only set the
      // duplicate `opportunity` -> 23502. amount := opportunity (same deal value, no value-logic change).
      const res = await runQuery<Row>(sql`
        INSERT INTO crm_deals (
          title, stage_id, company_id, opportunity, amount, assigned_by_id, created_by_id,
          probability, currency_id, close_date, additional_info, metadata
        )
        VALUES (
          ${title}, ${stageId}, ${companyId}, ${opportunity}, ${opportunity}, ${assignedById}, ${createdById},
          ${probability}, ${currency}, ${expectedClosureDate}, ${description},
          ${JSON.stringify({ lead_id: leadId })}::jsonb
        )
        RETURNING *
      `);
      return Ok(res.rows[0] ?? {});
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Row>> {
    try {
      const title        = (dto.title        != null) ? String(dto.title)                                        : null;
      const stageId      = (dto.stageId      ?? dto.stage_id)      != null ? String(dto.stageId      ?? dto.stage_id)      : null;
      const companyId    = (dto.companyId    ?? dto.company_id)     != null ? Number(dto.companyId    ?? dto.company_id)    || null : null;
      const opportunity  = (dto.opportunity  ?? dto.amount)         != null ? String(dto.opportunity  ?? dto.amount)        : null;
      const probability  = (dto.probability  != null)               ? Number(dto.probability)  : null;
      const assignedById = (dto.assignedById ?? dto.assigned_by_id) != null ? Number(dto.assignedById ?? dto.assigned_by_id) || null : null;
      const status       = (dto.status       != null) ? String(dto.status)                                       : null;
      const closeDate    = (dto.closeDate    ?? dto.close_date)     != null ? String(dto.closeDate    ?? dto.close_date)    : null;
      const notes        = (dto.notes        != null) ? String(dto.notes)                                        : null;

      // Live crm_deals: business status lives in free-form stage_id (stage_semantic_id has a
      // {process,success,fail} CHECK). Both stageId and status inputs target stage_id —
      // COALESCE picks whichever is provided. comments (not notes), date_modify (not updated_at).
      const res = await runQuery<Row>(sql`
        UPDATE crm_deals SET
          title          = COALESCE(${title},        title),
          stage_id       = COALESCE(${stageId}, ${status}, stage_id),
          company_id     = COALESCE(${companyId},    company_id),
          opportunity    = COALESCE(${opportunity},  opportunity),
          probability    = COALESCE(${probability},  probability),
          assigned_by_id = COALESCE(${assignedById}, assigned_by_id),
          close_date     = COALESCE(${closeDate},    close_date),
          comments       = COALESCE(${notes},        comments),
          date_modify    = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `);
      return Ok(res.rows[0] ?? {});
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE crm_deals SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
