import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

interface DesignApprovedPayload {
  orderId: number;
  designOrderId?: number;
  approvedAt?: string;
}

interface LabPassedPayload {
  orderId: number;
  inspectionId?: number;
  passedAt?: string;
}

type Row = Record<string, unknown>;

/**
 * Trigger 5 — Design ✅ + Lab ✅ → PP (texnologga signal).
 *
 * Bu listener `design.order.approved` yoki `qc.lab.passed` event'larini ushlaydi
 * va sales_orders jadvalida ikkala bayroq ham true bo'lganda
 * `pp.tech.three_checkpoint_passed` event'ini emit qilmaydi (chunki Tech 3
 * alohida — Trigger 6), balki `sd.order.design_lab_completed` event'ini emit
 * qiladi va texnologga signal beradi.
 *
 * ARCHITECTURE.md §10 #5
 */
@Injectable()
export class DesignLabCompletedListener {
  private readonly logger = new Logger(DesignLabCompletedListener.name);

  constructor(private readonly events: EventEmitter2) {}

  @OnEvent(ERP_EVENTS.DESIGN_APPROVED, { async: true, promisify: true })
  async onDesignApproved(payload: DesignApprovedPayload): Promise<void> {
    if (!Number.isFinite(payload?.orderId)) {
      this.logger.warn(`Trigger 5 (design): orderId yo'q`);
      return;
    }
    await this.checkBothCompleted(payload.orderId, 'design');
  }

  @OnEvent(ERP_EVENTS.LAB_TEST_PASSED, { async: true, promisify: true })
  async onLabPassed(payload: LabPassedPayload): Promise<void> {
    if (!Number.isFinite(payload?.orderId)) {
      this.logger.warn(`Trigger 5 (lab): orderId yo'q`);
      return;
    }
    await this.checkBothCompleted(payload.orderId, 'lab');
  }

  private async checkBothCompleted(orderId: number, source: 'design' | 'lab'): Promise<void> {
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
