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
import { ICrmDealsRepository, StageHistoryEntry, ExportAuditEntry } from './i-crm-deals.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleCrmDealsRepository implements ICrmDealsRepository {
  async findAll(limit: number, offset: number, ownerId?: number | null): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      // Item A row-scoping — CORRECTED 2026-07-11 (owner interview log; see crm-row-scope.ts
      // module doc comment): non-privileged callers see only their own deals, filtered on
      // COALESCE(assigned_by_id, manager_id) — assigned_to was the original canonical column but is
      // superseded (empty on legacy rows / not authorization-trustworthy). Applied to BOTH the count
      // and the page so the total never leaks the global count. ownerId == null → privileged → no filter.
      const ownerFilter = ownerId != null ? sql`AND COALESCE(assigned_by_id, manager_id) = ${ownerId}` : sql``;
      const [countRes, dataRes] = await Promise.all([
        runQuery<{ c: string }>(sql`SELECT count(*)::text AS c FROM crm_deals WHERE deleted_at IS NULL ${ownerFilter}`),
        runQuery<Row>(sql`
          SELECT * FROM crm_deals
          WHERE deleted_at IS NULL ${ownerFilter}
          ORDER BY date_create DESC
          LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return Ok({ data: dataRes.rows, count: Number(countRes.rows[0]?.c || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bitimlar topilmadi'); }
  }

  async findAllForExport(ownerId?: number | null): Promise<Result<Row[]>> {
    try {
      // Item 14: full (unpaginated) export, row-scoped identically to findAll (COALESCE(assigned_by_id,
      // manager_id) — corrected 2026-07-11, see findAll above / crm-row-scope.ts). Safety-capped so a
      // runaway export cannot OOM the API. ownerId == null → privileged → no owner filter.
      const ownerFilter = ownerId != null ? sql`AND COALESCE(assigned_by_id, manager_id) = ${ownerId}` : sql``;
      const res = await runQuery<Row>(sql`
        SELECT * FROM crm_deals
        WHERE deleted_at IS NULL ${ownerFilter}
        ORDER BY date_create DESC
        LIMIT 10000
      `);
      return Ok(res.rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Eksport uchun bitimlar topilmadi'); }
  }

  async recordExportAudit(entry: ExportAuditEntry): Promise<Result<void>> {
    try {
      // Item 14 (vision 13-crm#14 "eksport urinishi loglanadi"): one row per export. record_id='*'
      // = whole-table bulk export (no single record). id/created_at fill from column defaults
      // (gen_random_uuid()/now()); audit_logs.user_id/user_role are varchar → user id is stringified.
      await runQuery(sql`
        INSERT INTO audit_logs (table_name, record_id, action, user_id, user_role, new_values)
        VALUES (
          'crm_deals', '*', 'export',
          ${entry.userId != null ? String(entry.userId) : null},
          ${entry.userRole},
          ${JSON.stringify({ row_count: entry.rowCount, row_scoped: entry.scoped })}::jsonb
        )
      `);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Eksport auditini yozishda xatolik'); }
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
      // Item A (CRM ownership convergence) — CORRECTED 2026-07-11 (owner interview log; see
      // crm-row-scope.ts module doc comment): this comment originally declared assigned_to the
      // canonical owner column. That is superseded — assigned_by_id (Bitrix "responsible") is now
      // the authoritative column row-scoping/authorization reads (falling back to manager_id).
      // assigned_to is still written below (additive, unchanged) from the same resolved owner
      // (explicit assignee or, by default, the creator) for any existing display-only reader.
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
      // Item A: reassignment still updates assigned_to (unchanged, additive — see the CORRECTED
      // 2026-07-11 note in create() above / crm-row-scope.ts: row-scoping/authorization now reads
      // assigned_by_id, falling back to manager_id — NOT assigned_to). Accepts assignedTo (preferred)
      // or the Bitrix assignedById/assigned_by_id, so a manager can hand a deal to another manager.
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

  // Item 93 (ГП-kod takror buyurtma tugmasi): one-click "repeat order" — clone a past deal into a
  // fresh draft. Single atomic INSERT..SELECT copies the business fields straight from the source
  // row (same auto-updatable crm_deals view create() writes through) and flags the new deal
  // is_repeating=true. stage_id resets to the create() default 'qualification' (a repeat order is a
  // NEW opportunity to re-qualify — carrying over a won/lost stage would mis-state the pipeline).
  // assigned_to/assigned_by_id/created_by_id point at the acting manager so Item A row-scoping lets
  // them see their own clone; metadata keeps the source lead link (jsonb merge) and records
  // source_deal_id for provenance.
  async clone(sourceId: string, createdBy?: number): Promise<Result<Row>> {
    try {
      const creator = Number(createdBy) || null;
      const res = await runQuery<Row>(sql`
        INSERT INTO crm_deals (
          title, stage_id, company_id, lead_id, opportunity, amount, currency_id,
          probability, close_date, additional_info, assigned_by_id, assigned_to,
          created_by_id, is_repeating, metadata
        )
        SELECT
          title, 'qualification', company_id, lead_id, opportunity, amount, currency_id,
          probability, close_date, additional_info, ${creator}, ${creator},
          ${creator}, true,
          COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('source_deal_id', id::text)
        FROM crm_deals
        WHERE id = ${sourceId}::uuid AND deleted_at IS NULL
        RETURNING *
      `);
      if (!res.rows[0]) return Err(`Manba bitim #${sourceId} topilmadi`);
      return Ok(res.rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Klonlashda xatolik'); }
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
