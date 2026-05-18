/**
 * @module drizzle-pp-work-centers.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * NOTE: Canonical `work_centers` schema has uuid `id` and no `deletedAt`.
 * Soft-delete is modeled via `isActive=false`. The repository accepts numeric ids
 * from the controller for back-compat and converts to string for the uuid comparison.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { workCenters } from '@europrint/schemas';
import { eq, count, asc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpWorkCentersRepository } from './i-pp-work-centers.repo';

@Injectable()
export class DrizzlePpWorkCentersRepository implements IPpWorkCentersRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(workCenters).where(eq(workCenters.isActive, true)).orderBy(asc(workCenters.name));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ish markazlari topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(workCenters).where(eq(workCenters.id, String(id))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Ish markazi #${id} topilmadi`); }
  }

  async getStats(): Promise<Result<{ total: number; active: number; byType: Record<string, unknown>[] }>> {
    try {
      const [totalResult, activeResult, byTypeResult] = await Promise.all([
        db.select({ count: count() }).from(workCenters),
        db.select({ count: count() }).from(workCenters).where(eq(workCenters.isActive, true)),
        db.select().from(workCenters).groupBy(workCenters.type),
      ]);
      return Ok({ total: Number(totalResult[0]?.count || 0), active: Number(activeResult[0]?.count || 0), byType: byTypeResult });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Statistika topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof workCenters.$inferInsert, 'id'> = {
        name: (dto.name as string | undefined) ?? '',
        code: (dto.code as string | undefined) ?? '',
        type: (dto.type as string | undefined) ?? 'machine',
        capacity: dto.capacity as string | undefined,
        isActive: (dto.isActive as boolean | undefined) ?? true,
      };
      const result = await db.insert(workCenters).values(row as typeof workCenters.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(workCenters).set(dto as Partial<typeof workCenters.$inferInsert>).where(eq(workCenters.id, String(id))).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      // No deletedAt column on canonical schema — soft-delete by toggling isActive.
      await db.update(workCenters).set({ isActive: false }).where(eq(workCenters.id, String(id)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
