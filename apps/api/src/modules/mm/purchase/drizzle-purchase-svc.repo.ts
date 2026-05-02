import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { purchaseOrders, purchaseOrderItems } from '@europrint/schemas';
import { eq, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPurchaseSvcRepository } from './i-purchase-svc.repo';

@Injectable()
export class DrizzlePurchaseSvcRepository implements IPurchaseSvcRepository {
  async findAll(limit: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, purchaseOrders.id)).orderBy(desc(purchaseOrders.createdAt)).limit(limit);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Xarid buyurtmalari topilmadi');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).orderBy(desc(purchaseOrders.createdAt)).limit(1);
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
        status: 'draft',
        currency: dto.currency || 'UZS',
      } as typeof purchaseOrders.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }
}
