/**
 * @module pip.repository
 * @description PIP (Performance Improvement Plan) repository — Drizzle ORM, returns Result<T>.
 */
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { eq, desc } from 'drizzle-orm';
import { pipPlans, pipProgressUpdates } from '@workspace/db';

@Injectable()
export class PipRepository {
  async findAll(status?: string): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = status
        ? await db.select().from(pipPlans).where(eq(pipPlans.status, status)).orderBy(desc(pipPlans.createdAt))
        : await db.select().from(pipPlans).orderBy(desc(pipPlans.createdAt));
      return Ok(rows as Record<string, unknown>[]);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async findOne(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.select().from(pipPlans).where(eq(pipPlans.id, id));
      if (!row) return Err({ code: 'NOT_FOUND', message: `PIP #${id} topilmadi` });
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async create(dto: {
    employeeId: number;
    createdBy?: number;
    supervisorId?: number;
    goals?: string;
    successCriteria?: string;
    startDate: string;
    endDate: string;
    durationDays?: number;
  }): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(pipPlans).values({
        employeeId: dto.employeeId,
        createdBy: dto.createdBy ?? null,
        supervisorId: dto.supervisorId ?? null,
        goals: dto.goals ?? null,
        successCriteria: dto.successCriteria ?? null,
        startDate: dto.startDate,
        endDate: dto.endDate,
        durationDays: dto.durationDays ?? 30,
        status: 'draft',
      }).returning();
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async acknowledge(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.update(pipPlans)
        .set({ status: 'active', acknowledgedAt: new Date() })
        .where(eq(pipPlans.id, id))
        .returning();
      if (!row) return Err({ code: 'NOT_FOUND', message: `PIP #${id} topilmadi` });
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }

  async addProgress(pipId: number, dto: {
    notes: string;
    status?: string;
    updatedBy?: number;
  }): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.insert(pipProgressUpdates).values({
        pipId,
        notes: dto.notes,
        status: dto.status ?? null,
        updatedBy: dto.updatedBy ?? null,
      }).returning();
      return Ok(row as Record<string, unknown>);
    } catch (e) {
      return Err({ code: 'INTERNAL', message: String(e) });
    }
  }
}
