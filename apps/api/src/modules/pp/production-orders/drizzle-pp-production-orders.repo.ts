/**
 * @module drizzle-pp-production-orders.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { productionOrders } from '@europrint/schemas';
import { eq, isNull, count, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpProductionOrdersRepository } from './i-pp-production-orders.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzlePpProductionOrdersRepository implements IPpProductionOrdersRepository {
  private readonly logger = new Logger(DrizzlePpProductionOrdersRepository.name);
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(productionOrders).where(isNull(productionOrders.deletedAt)).limit(1).offset(0),
        db.select().from(productionOrders).where(isNull(productionOrders.deletedAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ishlab chiqarish buyurtmalari topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(productionOrders).where(eq(productionOrders.id, id)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Buyurtma #${id} topilmadi`); }
  }

  async findByOrderNumber(orderNumber: string): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(productionOrders).where(eq(productionOrders.orderNumber, orderNumber)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Buyurtma topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof productionOrders.$inferInsert, 'id'> = {
        orderNumber: dto.orderNumber as string | undefined,
        productId: dto.productId as string | undefined,
        quantity: (dto.quantity as string | undefined) ?? '1',
        unit: dto.unit as string | undefined,
        status: 'planned',
        plannedStart: dto.plannedStart as Date | undefined,
        plannedEnd: dto.plannedEnd as Date | undefined,
        createdBy: createdBy ? String(createdBy) : (dto.createdBy as string | undefined),
      };
      const result = await db.insert(productionOrders).values(row as typeof productionOrders.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof productionOrders.$inferInsert> = {
        ...(dto.orderNumber !== undefined ? { orderNumber: dto.orderNumber as string } : {}),
        ...(dto.productId !== undefined ? { productId: dto.productId as string } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity as string } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        ...(dto.plannedStart !== undefined ? { plannedStart: dto.plannedStart as Date } : {}),
        ...(dto.plannedEnd !== undefined ? { plannedEnd: dto.plannedEnd as Date } : {}),
        ...(dto.actualStart !== undefined ? { actualStart: dto.actualStart as Date } : {}),
        ...(dto.actualEnd !== undefined ? { actualEnd: dto.actualEnd as Date } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(productionOrders).set(patch).where(eq(productionOrders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async updateStatus(id: number, status: string, changedBy?: number, reason?: string): Promise<Result<Record<string, unknown>>> {
    try {
      // T18-C3: capture old status BEFORE the write so the audit log records the
      // real old→new transition (kim/qachon/eski→yangi).
      const before = await db.select({ status: productionOrders.status })
        .from(productionOrders).where(eq(productionOrders.id, id)).limit(1);
      const oldStatus = (before[0]?.status ?? null) as string | null;

      const result = await db.update(productionOrders).set({ status }).where(eq(productionOrders.id, id)).returning();

      // Only log a genuine change (no-op writes are not status transitions).
      if (oldStatus !== status) {
        // EP-PP-082 #2/#39: the written justification (sabab majburiy) is now persisted
        // on the audit row, not just seen by the AuditInterceptor.
        await this._logStatusChange(id, oldStatus, status, changedBy, reason);
      }
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }

  /**
   * Append a row to production_order_status_log. Non-fatal: a failed log write is
   * recorded but does NOT roll back the status change (audit is best-effort, the
   * status transition is the source of truth).
   */
  private async _logStatusChange(
    orderId: number,
    oldStatus: string | null,
    newStatus: string,
    changedBy?: number,
    reason?: string | null,
  ): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO production_order_status_log
          (production_order_id, old_status, new_status, changed_by, reason)
        VALUES (${orderId}, ${oldStatus}, ${newStatus}, ${changedBy ?? null}, ${reason ?? null})
      `);
    } catch (e: unknown) {
      this.logger.error({ msg: 'production_order_status_log insert failed', orderId, error: (e as Error)?.message });
    }
  }

  /**
   * SB0237 (06-PP audit) — write-path for isUrgent (EP-PP-097 ZARUR) and isFrozen/
   * frozenUntil (EP-PP-025/061 frozen-zone no-preempt). Role-gated at the controller
   * (owner/director authority — see production-priority.service.ts header comment).
   */
  async updateFlags(
    id: number,
    flags: { isUrgent?: boolean; isFrozen?: boolean; frozenUntil?: Date | null; reasonCodeId?: number },
  ): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof productionOrders.$inferInsert> = {
        ...(flags.isUrgent !== undefined ? { isUrgent: flags.isUrgent } : {}),
        ...(flags.isFrozen !== undefined ? { isFrozen: flags.isFrozen } : {}),
        ...(flags.frozenUntil !== undefined ? { frozenUntil: flags.frozenUntil } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(productionOrders).set(patch).where(eq(productionOrders.id, id)).returning();
      // VISION-3340 #23: persist the structured reason tag. reason_code_id is a
      // migration-added column (pp-reason-codes-shift-plans-2026-07-08.sql) not yet
      // mirrored in the productionOrders Drizzle table, so it is written via a
      // parameterised runQuery rather than the builder `set()` above. Only when the
      // caller supplied a value (no fabrication — Q-40).
      if (flags.reasonCodeId !== undefined) {
        await runQuery(sql`UPDATE production_orders SET reason_code_id = ${flags.reasonCodeId} WHERE id = ${id}`);
      }
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Flag yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(productionOrders).set({ deletedAt: _time.now() }).where(eq(productionOrders.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
