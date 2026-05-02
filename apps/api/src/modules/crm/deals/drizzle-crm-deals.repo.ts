import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { crmDeals } from '@europrint/schemas';
import { eq, and, isNull, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ICrmDealsRepository } from './i-crm-deals.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleCrmDealsRepository implements ICrmDealsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(crmDeals).where(isNull(crmDeals.deleted_at)).limit(1).offset(0),
        db.select().from(crmDeals).where(isNull(crmDeals.deleted_at)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bitimlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(crmDeals).where(and(eq(crmDeals.id, id), isNull(crmDeals.deleted_at))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Bitim #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row = {
        title:       (dto.title as string | undefined) ?? '',
        lead_id:     (dto.leadId ?? dto.lead_id) as string | undefined,
        company_id:  (dto.companyId ?? dto.company_id) as string | undefined,
        status:      (dto.status as string | undefined) ?? 'open',
        amount:      dto.amount as string | undefined,
        assigned_to: (dto.assignedTo ?? dto.assigned_to) as string | undefined,
        stage_id:    (dto.stageId ?? dto.stage_id) as string | undefined,
        created_by:  createdBy ? String(createdBy) : (dto.createdBy ?? dto.created_by) as string | undefined,
      };
      const result = await db.insert(crmDeals).values(row as typeof crmDeals.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(crmDeals).set(dto as Partial<typeof crmDeals.$inferInsert>).where(eq(crmDeals.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(crmDeals).set({ deleted_at: _time.now() }).where(eq(crmDeals.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
