import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { crmPipelines, crmStages } from '@europrint/schemas';
import { eq, asc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ICrmPipelinesRepository } from './i-crm-pipelines.repo';

@Injectable()
export class DrizzleCrmPipelinesRepository implements ICrmPipelinesRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(crmPipelines).orderBy(asc(crmPipelines.sort));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Pipeline-lar topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(crmPipelines).where(eq(crmPipelines.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Pipeline #${id} topilmadi`); }
  }

  async findStagesByCategoryId(categoryId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(crmStages).where(eq(crmStages.categoryId, categoryId)).orderBy(asc(crmStages.sort));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bosqichlar topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(crmPipelines).values(dto as typeof crmPipelines.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(crmPipelines).set(dto as Partial<typeof crmPipelines.$inferInsert>).where(eq(crmPipelines.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.delete(crmPipelines).where(eq(crmPipelines.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
