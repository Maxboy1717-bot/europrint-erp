/**
 * @module drizzle-pp-bom.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { bomHeaders, bomItems } from '@europrint/schemas';
import { eq, isNull, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpBomRepository } from './i-pp-bom.repo';

import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
@Injectable()
export class DrizzlePpBomRepository implements IPpBomRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(bomHeaders).where(isNull(bomHeaders.deletedAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(bomHeaders).where(isNull(bomHeaders.deletedAt)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'BOM-lar topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(bomHeaders).where(eq(bomHeaders.id, id)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `BOM #${id} topilmadi`); }
  }

  async findItemsByBomId(bomId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(bomItems).where(eq(bomItems.bomId, bomId)).limit(MAX_EXPORT_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'BOM elementlari topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof bomHeaders.$inferInsert, 'id'> = {
        productId: (dto.productId as string | undefined) ?? '',
        version: (dto.version as string | undefined) ?? '1.0',
        status: 'draft',
        isActive: (dto.isActive as boolean | undefined) ?? true,
      };
      const result = await db.insert(bomHeaders).values(row as typeof bomHeaders.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof bomHeaders.$inferInsert> = {
        ...(dto.productId !== undefined ? { productId: dto.productId as string } : {}),
        ...(dto.version !== undefined ? { version: dto.version as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive as boolean } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(bomHeaders).set(patch).where(eq(bomHeaders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async approve(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(bomHeaders).set({ status: 'active' }).where(eq(bomHeaders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Tasdiqlashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(bomHeaders).set({ deletedAt: _time.now() }).where(eq(bomHeaders.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
