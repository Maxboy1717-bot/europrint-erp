/**
 * @module design-lab-join.service
 * @description Wave 4 round-2 (PA2-18): shared helper for the Trigger 5
 *   join-check between Design✅ and Lab✅. Previously a private method on
 *   `DesignLabCompletedListener`, extracted so the split canonical
 *   `@EventsHandler(DesignApprovedEvent)` and `@EventsHandler(LabTestPassedEvent)`
 *   listeners can share the SQL + emit logic.
 *
 *   ARCHITECTURE.md §10 #5
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

type Row = Record<string, unknown>;

@Injectable()
export class DesignLabJoinService {
  private readonly logger = new Logger(DesignLabJoinService.name);

  constructor(private readonly events: EventEmitter2) {}

  async checkBothCompleted(orderId: number, source: 'design' | 'lab'): Promise<void> {
    if (!Number.isFinite(orderId)) {
      this.logger.warn(`Trigger 5 (${source}): orderId yo'q`);
      return;
    }

    const statusR = await this.fetchOrderStatus(orderId);
    if (isErr(statusR)) {
      this.logger.error(`Trigger 5: order ${orderId} status fail — ${statusR.error.message}`);
      return;
    }
    const row = statusR.data;
    if (!row) {
      this.logger.warn(`Trigger 5: order ${orderId} topilmadi`);
      return;
    }

    const designOk = String(row['design_status'] ?? '') === 'approved'
      || row['design_flag'] === false; // dizayn kerak emas bo'lsa, "tayyor" deb hisoblanadi
    const labOk = String(row['lab_status'] ?? '') === 'passed'
      || row['sample_flag'] === false; // namuna kerak emas bo'lsa, "tayyor"

    if (!designOk || !labOk) {
      this.logger.debug(
        `Trigger 5 partial: order ${orderId} source=${source} design=${designOk} lab=${labOk}`,
      );
      return;
    }

    const updateR = await this.markParallelDone(orderId);
    if (isErr(updateR)) {
      this.logger.error(`Trigger 5: order ${orderId} update fail — ${updateR.error.message}`);
      return;
    }
    if (!updateR.data) {
      this.logger.debug(`Trigger 5: order ${orderId} allaqachon parallel done`);
      return;
    }

    this.events.emit(ERP_EVENTS.DESIGN_AND_LAB_COMPLETED, {
      orderId,
      occurredAt: new Date().toISOString(),
    });
    this.logger.log(`Trigger 5: order ${orderId} → texnologga signal (parallel done)`);
  }

  private async fetchOrderStatus(orderId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const result = await db.execute<Row>(sql`
        SELECT id, design_flag, sample_flag, design_status, lab_status, master_status
        FROM sales_orders
        WHERE id = ${orderId}
        LIMIT 1
      `);
      const list = Array.isArray((result as { rows?: Row[] }).rows)
        ? ((result as { rows: Row[] }).rows)
        : (Array.isArray(result) ? (result as Row[]) : []);
      return list[0] ?? null;
    }, 'DB_ERROR');
  }

  private async markParallelDone(orderId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const upd = await db.execute<Row>(sql`
        UPDATE sales_orders
        SET master_status = 'pending_technology',
            updated_at = NOW()
        WHERE id = ${orderId}
          AND master_status IN ('pending_design', 'pending_sample_lab', 'pending_manager_completion')
        RETURNING id
      `);
      const list = Array.isArray((upd as { rows?: Row[] }).rows)
        ? ((upd as { rows: Row[] }).rows)
        : (Array.isArray(upd) ? (upd as Row[]) : []);
      return list.length > 0;
    }, 'DB_ERROR');
  }
}
