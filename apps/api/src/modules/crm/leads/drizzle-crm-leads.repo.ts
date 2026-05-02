import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { crmLeads } from '@europrint/schemas';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ICrmLeadsRepository } from './i-crm-leads.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleCrmLeadsRepository implements ICrmLeadsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(crmLeads).where(isNull(crmLeads.deleted_at)).limit(1).offset(0),
        db.select().from(crmLeads).where(isNull(crmLeads.deleted_at)).orderBy(desc(crmLeads.created_at)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Lidlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(crmLeads).where(and(eq(crmLeads.id, id), isNull(crmLeads.deleted_at))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Lid #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof crmLeads.$inferInsert, 'id'> = {
        first_name: (dto.firstName as string | undefined) ?? '',
        last_name:  (dto.lastName as string | undefined) ?? '',
        email:      (dto.email as string | undefined) ?? '',
        phone:      dto.phone as string | undefined,
        status:     (dto.status as string | undefined) ?? 'new',
        source:     dto.source as string | undefined,
        notes:      dto.notes as string | undefined,
        company_id: dto.companyId as number | undefined,
        assigned_to: dto.assignedTo as number | undefined,
        created_by:  createdBy ? createdBy : (dto.createdBy as number | undefined),
      };
      const result = await db.insert(crmLeads).values(row as typeof crmLeads.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(crmLeads).set(dto as Partial<typeof crmLeads.$inferInsert>).where(eq(crmLeads.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(crmLeads).set({ deleted_at: _time.now() }).where(eq(crmLeads.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
