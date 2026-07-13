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
    changedBy?: number,
    reason?: string,
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
      // EP-PP-082 #2/#39: the freeze/urgent override carries a MANDATORY written
      // justification (the DTO's `reason`). Previously it was validated then discarded
      // (only the generic AuditInterceptor saw it) — now persist it as an order-queryable
      // audit row on the status journal. A flag change is not a status transition, so
      // old_status === new_status (the order's CURRENT status, read off the updated row —
      // new_status is NOT NULL so a real value is required), and metadata.event tags it as
      // a flags override so timeline queries don't confuse it with a real transition.
      // Best-effort like the status log; only when a reason was actually supplied (Q-40).
      const curStatus = ((result[0] as Record<string, unknown> | undefined)?.status ?? null) as string | null;
      if (reason && curStatus) {
        const meta = JSON.stringify({
          event: 'flags_override',
          isUrgent: flags.isUrgent ?? null,
          isFrozen: flags.isFrozen ?? null,
          frozenUntil: flags.frozenUntil ? flags.frozenUntil.toISOString() : null,
          reasonCodeId: flags.reasonCodeId ?? null,
        });
        try {
          await runQuery(sql`
            INSERT INTO production_order_status_log
              (production_order_id, old_status, new_status, changed_by, reason, metadata)
            VALUES (${id}, ${curStatus}, ${curStatus}, ${changedBy ?? null}, ${reason}, ${meta}::jsonb)
          `);
        } catch (e: unknown) {
          this.logger.error({ msg: 'flags-override audit insert failed', id, error: (e as Error)?.message });
        }
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

  // EP-PP-085 "Очеред" (Batch 5 Item 4) — stanok-ichi navbat. Raw parametrized SQL (queue_sequence
  // is a migration-added column mirrored in the Drizzle def but written via runQuery for runtime
  // parity, like reason_code_id above). Returns orders for one work_center ordered by the operator's
  // visible queue number (NULLs — not yet queued — last), then priority/urgent as a tiebreak.
  async getQueueByWorkCenter(workCenterId: string): Promise<Result<Row[]>> {
    try {
      // BUGFIX (2026-07-13, security-sensitive 503 root cause): this previously selected
      // `planned_start`, which does not exist on production_orders (live columns are
      // `planned_start_date` varchar / `scheduled_start` timestamp / `actual_start`
      // timestamp — see \d production_orders). The undefined-column error threw a
      // DrizzleQueryError whose .message embeds the full raw SQL text, which then leaked
      // to the client (see api-request.ts throwIfResNotOk fix, same date). Corrected to
      // the real column, matching the sibling getWeeklyPlan() query below.
      const r = await runQuery<Row>(sql`
        SELECT id, order_number, product_name, status, priority, is_urgent, queue_sequence, planned_start_date
        FROM production_orders
        WHERE work_center_id = ${workCenterId} AND deleted_at IS NULL
        ORDER BY queue_sequence ASC NULLS LAST, is_urgent DESC, priority ASC, id ASC`);
      return Ok(r.rows as Row[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Navbatni olishda xatolik'); }
  }

  // Persist a drag-drop reorder: assign queue_sequence = 1..N in the given id order, atomically.
  // Two-phase (offset to a negative band first) so the partial-unique index
  // (work_center_id, queue_sequence) never trips mid-update on a swap. Only ids that belong to the
  // same work_center are touched; foreign ids are ignored by the WHERE guard.
  async reorderQueue(workCenterId: string, orderedIds: number[]): Promise<Result<Row[]>> {
    try {
      await db.transaction(async (tx) => {
        // Phase 1: park all target rows at negative sequences to clear the unique-index space.
        for (let i = 0; i < orderedIds.length; i++) {
          await tx.execute(sql`
            UPDATE production_orders SET queue_sequence = ${-(i + 1)}, updated_at = ${_time.now()}
            WHERE id = ${orderedIds[i]} AND work_center_id = ${workCenterId} AND deleted_at IS NULL`);
        }
        // Phase 2: set the real 1..N positions.
        for (let i = 0; i < orderedIds.length; i++) {
          await tx.execute(sql`
            UPDATE production_orders SET queue_sequence = ${i + 1}
            WHERE id = ${orderedIds[i]} AND work_center_id = ${workCenterId} AND deleted_at IS NULL`);
        }
      });
      return this.getQueueByWorkCenter(workCenterId);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Navbatni qayta tartiblashda xatolik'); }
  }

  // EP-PP-110 (Batch 5 Item 14) — haftalik reja: planned_start_date [weekStart, weekStart+6] oralig'ida.
  // planned_start_date varchar 'YYYY-MM-DD' (ISO → leksikografik = xronologik); weekEnd SQL'da hisoblanadi.
  async getWeeklyPlan(weekStart: string): Promise<Result<Row[]>> {
    try {
      const r = await runQuery<Row>(sql`
        SELECT id, order_number, product_name, status, priority, is_urgent, work_center_id,
               planned_start_date, planned_end_date, quantity, queue_sequence
        FROM production_orders
        WHERE deleted_at IS NULL
          AND planned_start_date IS NOT NULL
          AND planned_start_date >= ${weekStart}
          AND planned_start_date <= to_char((${weekStart})::date + 6, 'YYYY-MM-DD')
        ORDER BY planned_start_date, is_urgent DESC, priority ASC, id`);
      return Ok(r.rows as Row[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Haftalik rejani olishda xatolik'); }
  }

  // Move a production order to a different planned day/week (EP-PP-110 weekly view reschedule).
  async rescheduleOrder(id: number, plannedStartDate: string, plannedEndDate: string | null): Promise<Result<Row>> {
    try {
      const existing = await runQuery<Row>(sql`SELECT id FROM production_orders WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`);
      if (!existing.rows[0]) return Err({ code: 'NOT_FOUND', message: 'Buyurtma topilmadi' });
      const r = await runQuery<Row>(sql`
        UPDATE production_orders
        SET planned_start_date = ${plannedStartDate},
            planned_end_date = COALESCE(${plannedEndDate}, planned_end_date),
            updated_at = ${_time.now()}
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, order_number, planned_start_date, planned_end_date`);
      const row = r.rows[0];
      if (!row) return Err({ code: 'INTERNAL', message: 'Ko\'chirilmadi' });
      return Ok(row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ko\'chirishda xatolik'); }
  }

  /**
   * EP-PP-083 (#89) — Bekor qilish: atomic cancel with WIP/allocation reversal.
   * In ONE transaction: (1) flip the order to 'cancelled', (2) reverse every ACTIVE
   * material allocation tied to the order back to stock (status->'RETURNED',
   * returned_qty<-allocated_qty). COMPLETED (already-consumed) allocs are a genuine
   * material loss and are left untouched. (3) Persist the MANDATORY `reason` to the
   * status journal. Transition legality (only non-terminal->cancelled) is enforced by
   * the service (canTransition) BEFORE this runs, mirroring updateStatus.
   * production_material_allocs.production_order_id is varchar -> cast ${id}::text;
   * status CHECK allows only ('ACTIVE','COMPLETED','RETURNED').
   */
  async cancel(id: number, changedBy?: number, reason?: string): Promise<Result<{ order: Record<string, unknown>; reversedAllocs: number }>> {
    try {
      return await db.transaction(async (tx) => {
        const before = await tx.select({ status: productionOrders.status })
          .from(productionOrders).where(eq(productionOrders.id, id)).limit(1);
        const oldStatus = (before[0]?.status ?? null) as string | null;

        const updated = await tx.update(productionOrders)
          .set({ status: 'cancelled', updatedAt: _time.now() })
          .where(eq(productionOrders.id, id)).returning();
        const order = updated[0];

        const rev = await tx.execute(sql`
          UPDATE production_material_allocs
          SET status = 'RETURNED', returned_qty = allocated_qty, returned_at = ${_time.now()}, updated_at = ${_time.now()}
          WHERE production_order_id = ${id}::text AND status = 'ACTIVE'
          RETURNING id`);
        const revRows = Array.isArray((rev as { rows?: unknown[] }).rows)
          ? ((rev as { rows: unknown[] }).rows)
          : (Array.isArray(rev) ? (rev as unknown[]) : []);
        const reversedAllocs = revRows.length;

        // EP-PP-083: persist the mandatory written justification on the status journal.
        await tx.execute(sql`
          INSERT INTO production_order_status_log
            (production_order_id, old_status, new_status, changed_by, reason, metadata)
          VALUES (${id}, ${oldStatus}, ${'cancelled'}, ${changedBy ?? null}, ${reason ?? null}, ${JSON.stringify({ event: 'cancel', reversedAllocs })}::jsonb)`);

        return Ok({ order, reversedAllocs });
      });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bekor qilishda xatolik'); }
  }
}
