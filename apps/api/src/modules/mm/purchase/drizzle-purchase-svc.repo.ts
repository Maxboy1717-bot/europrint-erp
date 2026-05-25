/**
 * @module drizzle-purchase-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { purchaseOrders, purchaseOrderItems } from '@europrint/schemas';
import { eq, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPurchaseSvcRepository } from './i-purchase-svc.repo';

// NOTE: Canonical purchase_orders has snake_case columns (created_at, updated_at) and
// uuid id; status is a Postgres enum. We cast where the runtime values are accepted.
type PoStatus = 'draft' | 'cancelled' | 'invoiced' | 'pending' | 'approved' | 'partially_received' | 'received' | 'paid';

@Injectable()
export class DrizzlePurchaseSvcRepository implements IPurchaseSvcRepository {
  async findAll(limit: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, purchaseOrders.id)).orderBy(desc(purchaseOrders.created_at)).limit(limit);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Xarid buyurtmalari topilmadi');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, String(id))).orderBy(desc(purchaseOrders.created_at)).limit(1);
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Xarid #${id} topilmadi`);
    }
  }

  async findItemsByOrderId(orderId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, String(orderId))).orderBy(desc(purchaseOrderItems.id)).limit(100);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Xarid elementlari topilmadi');
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(purchaseOrders).values({
        ...dto,
        status: 'draft' as PoStatus,
        currency: dto.currency || 'UZS',
      } as typeof purchaseOrders.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(purchaseOrders).set({ status: status as PoStatus }).where(eq(purchaseOrders.id, String(id))).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }
}
