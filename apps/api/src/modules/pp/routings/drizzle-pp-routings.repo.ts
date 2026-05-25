/**
 * @module drizzle-pp-routings.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { routings, routingOperations } from '@europrint/schemas';
import { eq, isNull, count, desc, asc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpRoutingsRepository } from './i-pp-routings.repo';

type Row = Record<string, unknown>;
// NOTE: Canonical `routings` has uuid id, no deletedAt/updatedAt; soft-delete via is_active=false.

@Injectable()
export class DrizzlePpRoutingsRepository implements IPpRoutingsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(routings).where(eq(routings.is_active, true)).orderBy(desc(routings.created_at)).limit(limit).offset(offset),
        db.select({ count: count() }).from(routings).where(eq(routings.is_active, true)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Routinglar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(routings).where(eq(routings.id, String(id))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Routing #${id} topilmadi`); }
  }

  async findOperationsByRoutingId(routingId: string): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(routingOperations).where(eq(routingOperations.routingId, routingId)).orderBy(asc(routingOperations.sequence));
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Operatsiyalar topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(routings).values(dto as typeof routings.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(routings).set(dto as Partial<typeof routings.$inferInsert>).where(eq(routings.id, String(id))).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      // No deletedAt column on canonical schema — soft-delete by toggling is_active.
      await db.update(routings).set({ is_active: false } as Partial<typeof routings.$inferInsert>).where(eq(routings.id, String(id)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
