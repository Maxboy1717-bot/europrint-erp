import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { hrOnboardingChecklists } from '@workspace/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr, safeCall } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class OnboardingChecklistsRepository {
  async listAll(type?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const where = type
        ? eq(hrOnboardingChecklists.type, type)
        : undefined;
      const rows = where
        ? await db.select().from(hrOnboardingChecklists).where(where).orderBy(desc(hrOnboardingChecklists.updatedAt))
        : await db.select().from(hrOnboardingChecklists).orderBy(desc(hrOnboardingChecklists.updatedAt));
      return Array.isArray(rows) ? (rows as Row[]) : [];
    }, 'DB_ERROR');
  }

  async findById(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(hrOnboardingChecklists)
        .where(eq(hrOnboardingChecklists.id, id))
        .limit(1);
      return Array.isArray(rows) ? ((rows[0] ?? null) as Row | null) : null;
    }, 'DB_ERROR');
  }

  async findByUser(userId: number, type?: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const where = type
        ? and(eq(hrOnboardingChecklists.userId, userId), eq(hrOnboardingChecklists.type, type))
        : eq(hrOnboardingChecklists.userId, userId);
      const rows = await db
        .select()
        .from(hrOnboardingChecklists)
        .where(where)
        .orderBy(desc(hrOnboardingChecklists.updatedAt))
        .limit(1);
      return Array.isArray(rows) ? ((rows[0] ?? null) as Row | null) : null;
    }, 'DB_ERROR');
  }

  async create(dto: {
    userId: number;
    type: string;
    totalItems?: number;
    completedItems?: number;
  }): Promise<Result<Row>> {
    try {
      const rows = await db
        .insert(hrOnboardingChecklists)
        .values({
          userId: dto.userId,
          type: dto.type,
          totalItems: dto.totalItems ?? 12,
          completedItems: dto.completedItems ?? 0,
        })
        .returning();
      if (!Array.isArray(rows) || rows.length === 0) {
        return Err(AppErr('DB_ERROR', 'insert returned no rows'));
      }
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(AppErr('DB_ERROR', String(e)));
    }
  }

  async updateProgress(id: number, completedItems: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db
        .update(hrOnboardingChecklists)
        .set({ completedItems, updatedAt: sql`NOW()` })
        .where(eq(hrOnboardingChecklists.id, id))
        .returning();
      return Array.isArray(rows) ? ((rows[0] ?? null) as Row | null) : null;
    }, 'DB_ERROR');
  }
}
