/**
 * @module enps.repository
 * @description eNPS surveys repository — Drizzle ORM, returns Result<T>.
 */
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { eq, desc } from 'drizzle-orm';
import { enpsSurveys, enpsResponses } from '@workspace/db';

@Injectable()
export class EnpsRepository {
  async findAll(status?: string): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = status
        ? await db.select().from(enpsSurveys).where(eq(enpsSurveys.status, status)).orderBy(desc(enpsSurveys.createdAt))
        : await db.select().from(enpsSurveys).orderBy(desc(enpsSurveys.createdAt));
      return Ok(rows as Record<string, unknown>[]);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async findOne(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.select().from(enpsSurveys).where(eq(enpsSurveys.id, id));
      if (!row) return Err({ code: 'NOT_FOUND', message: `eNPS survey #${id} topilmadi` });
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async create(dto: {
    title: string;
    description?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    createdBy?: number;
  }): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(enpsSurveys).values({
        title: dto.title,
        description: dto.description ?? null,
        period: (dto.period ?? 'quarterly') as 'monthly' | 'quarterly' | 'annual',
        status: 'draft',
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        createdBy: dto.createdBy ?? null,
      }).returning();
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.update(enpsSurveys)
        .set({ status: status as 'draft' | 'active' | 'completed' | 'closed' })
        .where(eq(enpsSurveys.id, id))
        .returning();
      if (!row) return Err({ code: 'NOT_FOUND', message: `eNPS survey #${id} topilmadi` });
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async respond(dto: {
    surveyId: number;
    employeeId: number;
    score: number;
    comment?: string;
  }): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(enpsResponses).values({
        surveyId: dto.surveyId,
        employeeId: dto.employeeId,
        score: dto.score,
        comment: dto.comment ?? null,
      }).returning();
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
