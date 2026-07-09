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
import { ICrmDealsRepository, StageHistoryEntry } from './i-crm-deals.repo';

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

  async findById(id: string): Promise<Result<Row | null>> {
    try {
      const res = await runQuery<Row>(sql`
        SELECT * FROM crm_deals WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1
      `);
      return Ok(res.rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Bitim #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Row>> {
    try {
      const title               = String(dto.title ?? '');
      // VISION-3340 #28: default stage was the stale Bitrix-style 'C0:NEW', which never
      // matched a DEAL_STAGES column (real values: qualification/proposal/negotiation/won/
      // lost — see deal-status.vo.ts). 'qualification' is the same default the DDD
      // CreateDealCommand path uses (create-deal.handler.ts).
      const stageId             = String(dto.stageId ?? dto.stage_id ?? 'qualification');
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
      // Item A (CRM ownership convergence): assigned_to is the canonical owner column (mirrors
      // crm_leads). It already exists on base `deals` and is exposed by the crm_deals view, so no
      // migration is needed — just populate it here from the same resolved owner (explicit assignee
      // or, by default, the creator). assigned_by_id (Bitrix "responsible") is kept in sync.
      const res = await runQuery<Row>(sql`
        INSERT INTO crm_deals (
          title, stage_id, company_id, opportunity, amount, assigned_by_id, assigned_to, created_by_id,
          probability, currency_id, close_date, additional_info, metadata
        )
        VALUES (
          ${title}, ${stageId}, ${companyId}, ${opportunity}, ${opportunity}, ${assignedById}, ${assignedById}, ${createdById},
          ${probability}, ${currency}, ${expectedClosureDate}, ${description},
          ${JSON.stringify({ lead_id: leadId })}::jsonb
        )
        RETURNING *
      `);
      return Ok(res.rows[0] ?? {});
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: string, dto: Record<string, unknown>): Promise<Result<Row>> {
    try {
      const title        = (dto.title        != null) ? String(dto.title)                                        : null;
      const stageId      = (dto.stageId      ?? dto.stage_id)      != null ? String(dto.stageId      ?? dto.stage_id)      : null;
      const companyId    = (dto.companyId    ?? dto.company_id)     != null ? Number(dto.companyId    ?? dto.company_id)    || null : null;
      const opportunity  = (dto.opportunity  ?? dto.amount)         != null ? String(dto.opportunity  ?? dto.amount)        : null;
      const probability  = (dto.probability  != null)               ? Number(dto.probability)  : null;
      const assignedById = (dto.assignedById ?? dto.assigned_by_id) != null ? Number(dto.assignedById ?? dto.assigned_by_id) || null : null;
      // Item A: reassignment updates the canonical assigned_to. Accepts assignedTo (preferred) or the
      // Bitrix assignedById/assigned_by_id, so a manager can hand a deal to another manager.
      const ownerId      = (dto.assignedTo ?? dto.assignedById ?? dto.assigned_by_id) != null ? Number(dto.assignedTo ?? dto.assignedById ?? dto.assigned_by_id) || null : null;
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
          assigned_to    = COALESCE(${ownerId},      assigned_to),
          close_date     = COALESCE(${closeDate},    close_date),
          comments       = COALESCE(${notes},        comments),
          date_modify    = NOW()
        WHERE id = ${id}::uuid AND deleted_at IS NULL
        RETURNING *
      `);
      return Ok(res.rows[0] ?? {});
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: string): Promise<Result<void>> {
    try {
      await runQuery(sql`
        UPDATE crm_deals SET deleted_at = NOW() WHERE id = ${id}::uuid AND deleted_at IS NULL
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }

  // VISION-3340 #34: append-only stage-transition audit row. Raw parametrized INSERT (same
  // @shared/db runQuery style this repo uses everywhere) — crm_stage_history has no Drizzle
  // binding. entity_id holds the deal UUID as text; from_stage/to_stage are stage codes.
  async recordStageHistory(entry: StageHistoryEntry): Promise<Result<void>> {
    try {
      await runQuery(sql`
        INSERT INTO crm_stage_history (entity_type, entity_id, from_stage, to_stage, changed_by)
        VALUES (${entry.entityType}, ${entry.entityId}, ${entry.fromStage}, ${entry.toStage}, ${entry.changedBy})
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Stage tarixini yozishda xatolik'); }
  }
}
