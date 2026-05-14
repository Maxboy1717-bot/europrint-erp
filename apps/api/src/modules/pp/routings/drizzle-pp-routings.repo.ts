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
@Injectable()
export class DrizzlePpRoutingsRepository implements IPpRoutingsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(routings).where(isNull(routings.deletedAt)).orderBy(desc(routings.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(routings).where(isNull(routings.deletedAt)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Routinglar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(routings).where(eq(routings.id, id)).limit(1).offset(0);
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
      const result = await db.update(routings).set(dto as Partial<typeof routings.$inferInsert>).where(eq(routings.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(routings).set({ deletedAt: new Date() } as Partial<typeof routings.$inferInsert>).where(eq(routings.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
