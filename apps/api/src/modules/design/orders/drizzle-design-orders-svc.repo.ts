/**
 * @module drizzle-design-orders-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { designOrders } from '@europrint/schemas';
import { eq, and, isNull, desc, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IDesignOrdersSvcRepository } from './i-design-orders-svc.repo';

@Injectable()
export class DrizzleDesignOrdersSvcRepository implements IDesignOrdersSvcRepository {
  async findAll(opts?: { limit?: number; offset?: number }): Promise<Result<object[]>> {
    try {
      const lim = opts?.limit ?? 10;
      const off = opts?.offset ?? 0;
      const rows = await db.select().from(designOrders)
        .where(isNull(designOrders.deletedAt))
        .orderBy(desc(designOrders.createdAt))
        .limit(lim)
        .offset(off);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Dizayn buyurtmalari topilmadi');
    }
  }

  async count(): Promise<Result<number>> {
    try {
      const rows = await db.select({ total: count() }).from(designOrders).where(isNull(designOrders.deletedAt));
      return Ok(Number(rows[0]?.total ?? 0));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Count xatolik');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(designOrders).where(and(eq(designOrders.id, id), isNull(designOrders.deletedAt)));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Dizayn buyurtmasi #${id} topilmadi`);
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(designOrders).values({ ...dto, status: 'new' } as typeof designOrders.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(designOrders).set({ status }).where(eq(designOrders.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }

  async ensureForSalesOrder(
    salesOrderId: string,
    data: { orderNumber: string; title: string },
  ): Promise<Result<{ created: boolean; id: number }>> {
    try {
      // Idempotency: one design task per (live) sales order — dedupe on the link.
      const existing = await db
        .select({ id: designOrders.id })
        .from(designOrders)
        .where(and(eq(designOrders.salesOrderId, salesOrderId), isNull(designOrders.deletedAt)))
        .limit(1);
      if (existing[0]) return Ok({ created: false, id: existing[0].id });

      const inserted = await db
        .insert(designOrders)
        .values({
          salesOrderId,
          orderNumber: data.orderNumber,
          title: data.title,
          status: 'new',
          priority: 'normal',
        } as typeof designOrders.$inferInsert)
        .returning({ id: designOrders.id });
      return Ok({ created: true, id: inserted[0]?.id ?? 0 });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Dizayn buyurtmasini ta\'minlashda xatolik');
    }
  }
}
