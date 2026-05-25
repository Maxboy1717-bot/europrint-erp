/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   advance-payment UPDATE that mutates balance_due_amount with
 *   GREATEST(0, COALESCE(total_amount::numeric, 0) - ${amount}::numeric)
 *   computed in-place, and the cancel() cross-table kanban_cards description
 *   append (COALESCE(description, '') || E'\n[...]') filtered by
 *   related_type/related_id polymorphic-reference shape.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module drizzle-sd-orders.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
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
      const rows = await db.select().from(salesOrders).where(sql`id = ${id} AND deleted_at IS NULL`).limit(1).offset(0);
      return Ok((rows[0] as SalesOrderRow) || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Buyurtma #${id} topilmadi`); }
  }

  async findByDocumentNumber(docNum: string) {
    try {
      const rows = await db.select().from(salesOrders).where(sql`document_number = ${docNum} AND deleted_at IS NULL`).limit(1).offset(0);
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
      const result = await db.update(salesOrders).set(patch).where(sql`id = ${id} AND deleted_at IS NULL`).returning();
      return Ok(result[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async updateMasterStatus(id: number, masterStatus: string) {
    try {
      const result = await db.update(salesOrders).set({ overallStatus: masterStatus, updatedAt: _time.now() }).where(sql`id = ${id} AND deleted_at IS NULL`).returning();
      return Ok(result[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }

  async updateAdvancePayment(id: number, dto: { advancePaidAmount: string; advanceStatus: string; balanceDueAmount: string }) {
    try {
      const amount = dto.advancePaidAmount;
      await db.execute(sql`
        UPDATE sales_orders
        SET advance_paid_amount = ${amount},
            advance_status = 'paid',
            balance_due_amount = GREATEST(0, COALESCE(total_amount::numeric, 0) - ${amount}::numeric),
            updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
      `);
      const rows = await db.select().from(salesOrders).where(sql`id = ${id} AND deleted_at IS NULL`).limit(1);
      return Ok(rows[0] as SalesOrderRow);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Avans yangilashda xatolik'); }
  }

  async cancel(id: number): Promise<Result<void>> {
    try {
      // Atomic: kanban description annotation + sales_orders soft-delete must succeed together.
      // Without tx, a kanban-side failure would leave the order live but with a "cancelled" annotation
      // on its board card (or vice versa: order soft-deleted but kanban still active).
      await db.transaction(async (tx) => {
        await tx.execute(sql`
          UPDATE kanban_cards SET
            description = COALESCE(description, '') || E'\n[Buyurtma bekor qilindi]',
            updated_at = NOW()
          WHERE related_type = 'sales_order' AND related_id::text = ${id}::text AND deleted_at IS NULL
        `);
        await tx.update(salesOrders)
          .set({ overallStatus: 'CANCELLED', status: 'cancelled', deletedAt: _time.now() })
          .where(sql`id = ${id}`);
      });
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
