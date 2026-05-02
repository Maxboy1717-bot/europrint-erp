import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { salesOrders } from '@europrint/schemas';
import { eq, isNull, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ISdOrdersRepository } from './i-sd-orders.repo';

type SalesOrderRow = typeof salesOrders.$inferSelect;

@Injectable()
export class DrizzleSdOrdersRepository implements ISdOrdersRepository {
  async findAll() {
    try {
      const rows = await db.select().from(salesOrders).where(isNull(salesOrders.deletedAt));
      return Ok(rows as SalesOrderRow[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Buyurtmalar topilmadi'); }
  }

  async findById(id: number) {
    try {
      const rows = await db.select().from(salesOrders).where(sql`id = ${id}`).limit(1).offset(0);
      return Ok((rows[0] as SalesOrderRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Buyurtma #${id} topilmadi`); }
  }

  async findByDocumentNumber(docNum: string) {
    try {
      const rows = await db.select().from(salesOrders).where(eq(salesOrders.documentNumber, docNum)).limit(1).offset(0);
      return Ok((rows[0] as SalesOrderRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Buyurtma topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number) {
    try {
      const row: Omit<typeof salesOrders.$inferInsert, 'id'> = {
        customerId: dto.customerId as string | undefined,
        status: 'draft',
        currency: (dto.currency as string | undefined) ?? 'UZS',
        totalAmount: dto.totalAmount as string | undefined,
        notes: dto.notes as string | undefined,
        documentNumber: (dto.documentNumber ?? dto.orderNumber) as string | undefined,
        createdBy: createdBy !== undefined ? String(createdBy) : (dto.createdBy as string | undefined),
      };
      const result = await db.insert(salesOrders).values(row as typeof salesOrders.$inferInsert).returning();
      return Ok(result[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>) {
    try {
      const patch: Partial<typeof salesOrders.$inferInsert> = {
        ...(dto.customerId !== undefined ? { customerId: dto.customerId as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        ...(dto.overallStatus !== undefined ? { overallStatus: dto.overallStatus as string } : {}),
        ...(dto.deliveryStatus !== undefined ? { deliveryStatus: dto.deliveryStatus as string } : {}),
        ...(dto.billingStatus !== undefined ? { billingStatus: dto.billingStatus as string } : {}),
        ...(dto.totalAmount !== undefined ? { totalAmount: dto.totalAmount as string } : {}),
        ...(dto.netValue !== undefined ? { netValue: dto.netValue as string } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency as string } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes as string } : {}),
        ...(dto.documentNumber !== undefined ? { documentNumber: dto.documentNumber as string } : {}),
        ...(dto.createdBy !== undefined ? { createdBy: dto.createdBy as string } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(salesOrders).set(patch).where(sql`id = ${id}`).returning();
      return Ok(result[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async updateMasterStatus(id: number, masterStatus: string) {
    try {
      const result = await db.update(salesOrders).set({ overallStatus: masterStatus, updatedAt: _time.now() }).where(sql`id = ${id}`).returning();
      return Ok(result[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }

  async updateAdvancePayment(id: number, dto: { advancePaidAmount: string; advanceStatus: string; balanceDueAmount: string }) {
    try {
      await db.execute(sql`UPDATE sales_orders SET notes = COALESCE(notes,'') || ' [advance:' || ${dto.advancePaidAmount} || ']', updated_at = NOW() WHERE id = ${id}`);
      const rows = await db.select().from(salesOrders).where(sql`id = ${id}`).limit(1);
      return Ok(rows[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Avans yangilashda xatolik'); }
  }

  async cancel(id: number): Promise<Result<void>> {
    try {
      await db.update(salesOrders).set({ overallStatus: 'CANCELLED', status: 'cancelled', deletedAt: _time.now() }).where(sql`id = ${id}`);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
