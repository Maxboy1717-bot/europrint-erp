import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmDeals } from '@shared/db';
import { Deal } from '../../domain/aggregates/deal.aggregate';
import { IDealRepository } from '../../domain/repositories/i-deal.repo';
import { DealStatus } from '../../domain/value-objects/deal-status.vo';
import { Money } from '@shared/domain/value-objects/money.vo';
import { Ok, Result } from '@common/result';

type DbRow = Record<string, unknown>;

@Injectable()
export class DrizzleDealRepository implements IDealRepository {
  async save(deal: Deal): Promise<Result<Deal>> {
    const payload: Omit<typeof crmDeals.$inferInsert, 'id'> = {
      lead_id:    deal.getLeadId(),
      company_id: String(deal.getCompanyId()),
      status:     deal.getStatus(),
      amount:     String(deal.getTotalAmount()),
    };
    await db.insert(crmDeals).values(payload as typeof crmDeals.$inferInsert).onConflictDoNothing();
    return Ok(deal);
  }

  async findById(id: number): Promise<Result<Deal | null>> {
    const rows = await db.select().from(crmDeals).where(eq(crmDeals.id, id)).limit(1);
    if (!rows[0]) return Ok(null);
    return Ok(this.toDomain(castTo<DbRow>(rows[0])));
  }

  async findByLeadId(leadId: number): Promise<Result<Deal | null>> {
    const rows = await db.select().from(crmDeals).where(eq(crmDeals.lead_id, leadId)).limit(1);
    if (!rows[0]) return Ok(null);
    return Ok(this.toDomain(castTo<DbRow>(rows[0])));
  }

  async findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<Deal[]>> {
    const rows = await db.select().from(crmDeals)
      .where(sql`${crmDeals.company_id}::int = ${companyId}`)
      .limit(limit).offset(offset);
    return Ok(rows.map((r) => this.toDomain(castTo<DbRow>(r))));
  }

  async findByStatus(status: string, limit: number, offset: number): Promise<Result<Deal[]>> {
    const rows = await db.select().from(crmDeals)
      .where(eq(crmDeals.status, status))
      .limit(limit).offset(offset);
    return Ok(rows.map((r) => this.toDomain(castTo<DbRow>(r))));
  }

  async update(deal: Deal): Promise<Result<void>> {
    await db.update(crmDeals).set({
      status:     deal.getStatus(),
      updated_at: _time.now(),
    }).where(eq(crmDeals.id, deal.getId()));
    return Ok();
  }

  async delete(id: number): Promise<Result<void>> {
    await db.delete(crmDeals).where(eq(crmDeals.id, id));
    return Ok();
  }

  async countByStatus(status: string): Promise<Result<number>> {
    const rows = await db.select({ count: sql<string>`COUNT(*)` })
      .from(crmDeals).where(eq(crmDeals.status, status));
    return Ok(Number(rows[0]?.count ?? 0));
  }

  private parseDealStatus(raw: string): DealStatus {
    const r = DealStatus.create(raw);
    if (r.ok && r.data) return r.data;
    const fallback = DealStatus.create('qualification');
    if (fallback.ok && fallback.data) return fallback.data;
    throw new InternalServerErrorException(`Cannot create DealStatus from: ${raw}`);
  }

  private toDomain(row: DbRow): Deal {
    const moneyResult = Money.of(Number(row['total_amount'] ?? 0), String(row['currency'] ?? 'USD'));
    return new Deal({
      id:                  Number(row['id']),
      leadId:              Number(row['lead_id']),
      companyId:           Number(row['company_id']),
      dealNumber:          String(row['deal_number'] ?? ''),
      status:              this.parseDealStatus(String(row['status'] ?? 'qualification')),
      totalAmount:         moneyResult,
      currency:            String(row['currency'] ?? 'USD'),
      assignedTo:          Number(row['assigned_to']),
      createdBy:           Number(row['created_by']),
      description:         row['description'] ? String(row['description']) : undefined,
      expectedClosureDate: new Date(String(row['expected_closure_date'] ?? _time.now())),
      closedAt:            row['closed_at'] ? new Date(String(row['closed_at'])) : undefined,
      createdAt:           new Date(String(row['created_at'] ?? _time.now())),
      updatedAt:           new Date(String(row['updated_at'] ?? _time.now())),
    });
  }
}
