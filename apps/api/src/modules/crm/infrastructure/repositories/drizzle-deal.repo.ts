/**
 * @module drizzle-deal.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmDeals } from '@shared/db';
import { Deal } from '../../domain/aggregates/deal.aggregate';
import { IDealRepository } from '../../domain/repositories/i-deal.repo';
import { DealStatus } from '../../domain/value-objects/deal-status.vo';
import { Money } from '@shared/domain/value-objects/money.vo';
import { Ok, Err, Result } from '@common/result';

type DbRow = Record<string, unknown>;

@Injectable()
export class DrizzleDealRepository implements IDealRepository {
  async save(deal: Deal): Promise<Result<Deal>> {
    try {
      // Live crm_deals has no lead_id column → store the lead link in metadata (jsonb).
      // company_id is integer in live; status/assigned_to/created_by/currency_id/close_date/
      // additional_info map to the real columns via the def aliases. title is NOT NULL in
      // live DB → must be set (dealNumber). Persist the full submitted deal (no silent loss).
      const payload: Omit<typeof crmDeals.$inferInsert, 'id'> = {
        company_id:      Number(deal.getCompanyId()) || null,
        title:           deal.getDealNumber(),
        status:          deal.getStatus(),
        amount:          String(deal.getTotalAmount()),
        opportunity:     String(deal.getTotalAmount()), // live opportunity is NOT NULL (Bitrix canonical value)
        assigned_to:     Number(deal.getAssignedTo()) || null,
        created_by:      Number(deal.getCreatedBy()) || null,
        currency_id:     deal.getCurrency(),
        close_date:      deal.getExpectedClosureDate().toISOString().slice(0, 10),
        additional_info: deal.getDescription() ?? null,
        metadata:        { lead_id: deal.getLeadId() },
      };
      // Rebuild from the inserted row so the caller gets the DB-generated id (the
      // sequence) and round-tripped fields — without .returning() the aggregate keeps
      // its placeholder id 0. onConflictDoNothing → empty result = no insert; fall back.
      const inserted = await db.insert(crmDeals).values(payload as typeof crmDeals.$inferInsert).onConflictDoNothing().returning();
      if (inserted[0]) return Ok(this.toDomain(castTo<DbRow>(inserted[0])));
      return Ok(deal);
    } catch (e) {
      return Err(`drizzle_deal.save: ${String(e)}`);
    }
  }

  async findById(id: string): Promise<Result<Deal | null>> {
    try {
      // Live crm_deals.id is uuid; the compat crmDeals Drizzle def types `id` as integer,
      // so it cannot be addressed via `eq(crmDeals.id, uuid)`. Query by an explicit ::uuid
      // cast (raw parameterized SQL, Rule B) — mirrors the won path / DrizzleCrmDealsRepository.
      const res = await runQuery<DbRow>(sql`
        SELECT * FROM crm_deals WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1
      `);
      if (!res.rows[0]) return Ok(null);
      return Ok(this.toDomain(castTo<DbRow>(res.rows[0])));
    } catch (e) {
      return Err(`drizzle_deal.findById: ${String(e)}`);
    }
  }

  async findByLeadId(leadId: number): Promise<Result<Deal | null>> {
    try {
      // lead link lives in metadata jsonb (no lead_id column in live crm_deals)
      const rows = await db.select().from(crmDeals).where(sql`(${crmDeals.metadata}->>'lead_id')::int = ${leadId}`).limit(1);
      if (!rows[0]) return Ok(null);
      return Ok(this.toDomain(castTo<DbRow>(rows[0])));
    } catch (e) {
      return Err(`drizzle_deal.findByLeadId: ${String(e)}`);
    }
  }

  async findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<Deal[]>> {
    try {
      const rows = await db.select().from(crmDeals)
        .where(sql`${crmDeals.company_id}::int = ${companyId}`)
        .limit(limit).offset(offset);
      return Ok(rows.map((r) => this.toDomain(castTo<DbRow>(r))));
    } catch (e) {
      return Err(`drizzle_deal.findByCompanyId: ${String(e)}`);
    }
  }

  async findByStatus(status: string, limit: number, offset: number): Promise<Result<Deal[]>> {
    try {
      const rows = await db.select().from(crmDeals)
        .where(eq(crmDeals.status, status))
        .limit(limit).offset(offset);
      return Ok(rows.map((r) => this.toDomain(castTo<DbRow>(r))));
    } catch (e) {
      return Err(`drizzle_deal.findByStatus: ${String(e)}`);
    }
  }

  async update(id: string, patch: Record<string, unknown>): Promise<Result<void>> {
    try {
      const stageId    = patch['stage_id']    != null ? String(patch['stage_id'])    : null;
      const lostReason = patch['lost_reason'] != null ? String(patch['lost_reason']) : null;
      // Terminal (lost) transition persist, addressed by the real uuid. Business status
      // lives in free-form stage_id — NEVER stage_semantic_id ({process,success,fail}
      // CHECK). lost_reason is the real free-text column (lost_reason_id does NOT exist).
      // Raw parameterized SQL (Rule B): the compat crm_deals def types id as integer and
      // omits lost_reason/closed, so these live columns can't be written via the binding.
      await db.execute(sql`
        UPDATE crm_deals
           SET stage_id    = COALESCE(${stageId}, stage_id),
               lost_reason = COALESCE(${lostReason}, lost_reason),
               closed      = true,
               closed_at   = NOW(),
               date_modify = NOW()
         WHERE id = ${id}::uuid AND deleted_at IS NULL
      `);
      return Ok();
    } catch (e) {
      return Err(`drizzle_deal.update: ${String(e)}`);
    }
  }

  async updateLostReasonId(dealId: string, lostReasonId: number): Promise<Result<void>> {
    try {
      // VISION-3340 #31 / Batch 5 Item 1: targeted additive UPDATE of the taxonomy FK only.
      // ⚠️ crm_deals is a VIEW; the FK column lives on the BASE `deals` table (migration
      // item1-crm-deals-lost-reason-id) — write it there directly via parameterized raw SQL
      // (Rule B: sql`` params, no injection). Writing through the view would fail (the view
      // does not expose lost_reason_id and is being recreated by the ownership session).
      await db.execute(sql`
        UPDATE deals
        SET lost_reason_id = ${lostReasonId}
        WHERE id = ${dealId}::uuid
      `);
      return Ok();
    } catch (e) {
      return Err(`drizzle_deal.updateLostReasonId: ${String(e)}`);
    }
  }

  async delete(id: number): Promise<Result<void>> {
    try {
      await db.delete(crmDeals).where(eq(crmDeals.id, id));
      return Ok();
    } catch (e) {
      return Err(`drizzle_deal.delete: ${String(e)}`);
    }
  }

  async countByStatus(status: string): Promise<Result<number>> {
    try {
      const rows = await db.select({ count: sql<string>`COUNT(*)` })
        .from(crmDeals).where(eq(crmDeals.status, status));
      return Ok(Number(rows[0]?.count ?? 0));
    } catch (e) {
      return Err(`drizzle_deal.countByStatus: ${String(e)}`);
    }
  }

  private parseDealStatus(raw: string): DealStatus {
    const r = DealStatus.create(raw);
    if (r.ok && r.data) return r.data;
    const fallback = DealStatus.create('qualification');
    if (fallback.ok && fallback.data) return fallback.data;
    throw new InternalServerErrorException(`Cannot create DealStatus from: ${raw}`);
  }

  private toDomain(row: DbRow): Deal {
    // Hydration path — DB values were validated on write, so we use the
    // throwing factory and surface integrity errors as 5xx.
    // Live crm_deals (Bitrix) keys: amount, stage_semantic_id, date_create/date_modify,
    // assigned_by_id, created_by_id, title, metadata (holds lead_id). No lead_id/status/
    // created_at/deal_number/currency columns — read the real ones with fallbacks.
    const meta = (row['metadata'] ?? {}) as Record<string, unknown>;
    const leadIdRaw = meta['lead_id'] ?? row['lead_id'];
    const currencyRaw = String(row['currency_id'] ?? row['currency'] ?? 'USD');
    const moneyResult = Money.ofOrThrow(Number(row['amount'] ?? row['total_amount'] ?? 0), currencyRaw);
    return new Deal({
      id:                  Number(row['id']),
      leadId:              Number(leadIdRaw ?? 0),
      companyId:           Number(row['company_id']),
      dealNumber:          String(row['title'] ?? row['deal_number'] ?? ''),
      status:              this.parseDealStatus(String(row['stage_id'] ?? row['stage_semantic_id'] ?? row['status'] ?? 'qualification')),
      totalAmount:         moneyResult,
      currency:            currencyRaw,
      assignedTo:          Number(row['assigned_by_id'] ?? row['assigned_to'] ?? 0),
      createdBy:           Number(row['created_by_id'] ?? row['created_by'] ?? 0),
      description:         row['additional_info'] ? String(row['additional_info']) : undefined,
      expectedClosureDate: new Date(String(row['close_date'] ?? _time.now())),
      closedAt:            row['closed'] ? new Date(String(row['date_modify'])) : undefined,
      createdAt:           new Date(String(row['date_create'] ?? _time.now())),
      updatedAt:           new Date(String(row['date_modify'] ?? _time.now())),
    });
  }
}
