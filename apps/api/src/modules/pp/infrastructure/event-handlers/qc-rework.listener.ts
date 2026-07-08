/**
 * @module qc-rework.listener
 * @description T27-A2-QC-REWORK: canonical CQRS @EventsHandler. Listens for
 *   QcReworkEvent (published by qc/submit-inspection.handler when an inspector's
 *   third decision is REWORK / Qayta ishlash) and returns the inspected
 *   production order to a `rework` state so MES re-plans it.
 *
 *   Golden thread: SD → PP → MES → QC → (rework) → MES re-plan.
 *   QcReworkEvent.orderId is the production_orders.id (qc_inspections.order_id
 *   maps 1:1 to production_orders.id — verified live 2026-06-27: inspections
 *   order_id 48/49/50 ⇔ production_orders id 48/49/50).
 *
 *   Idempotent: a single rework on a production order produces exactly one
 *   `rework` transition (WHERE status <> 'rework'). Graceful: if no matching
 *   open production order exists the handler skips with a log — no fabrication.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { QcReworkEvent } from '@modules/qc/domain/events';

type Row = Record<string, unknown>;

/**
 * QC REWORK → PP/MES re-plan.
 *
 * Inspeksiya `rework` qaroriga kelganda, tekshirilgan ishlab chiqarish
 * buyurtmasi (production_orders) `rework` holatiga qaytariladi. MES queue
 * keyingi rejalashtirishda bu buyurtmani qayta oladi.
 *
 * ARCHITECTURE: QC → PP rework loop. Bir rework = bir status transition.
 */
@Injectable()
@EventsHandler(QcReworkEvent)
export class QcReworkListener implements IEventHandler<QcReworkEvent> {
  private readonly logger = new Logger(QcReworkListener.name);

  async handle(event: QcReworkEvent): Promise<void> {
    const orderId = Number(event.orderId);

    if (!Number.isFinite(orderId) || orderId <= 0) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QC rework: orderId yo\'q yoki noto\'g\'ri — skip',
      );
      return;
    }

    const updR = await this.returnToRework(orderId, event.reason);
    if (isErr(updR)) {
      this.logger.error(
        { orderId, inspectionId: event.inspectionId, error: updR.error.message },
        'QC rework: production_orders update xatosi',
      );
      return;
    }

    if (updR.data) {
      this.logger.log(
        { orderId, inspectionId: event.inspectionId },
        'QC rework ✅ — ishlab chiqarish buyurtmasi rework holatiga qaytarildi (MES qayta-rejalashtiradi)',
      );
    } else {
      // Graceful no-op: order topilmadi yoki allaqachon rework holatida (idempotent).
      this.logger.debug(
        { orderId, inspectionId: event.inspectionId },
        'QC rework: mos ochiq buyurtma topilmadi yoki allaqachon rework holatida — skip',
      );
    }
  }

  /**
   * Production order'ni `rework` holatiga qaytaradi (idempotent).
   * Soft-delete qilingan yoki allaqachon `rework` bo'lgan buyurtma o'tkazilmaydi.
   * Rework sababi notes'ga additiv qo'shiladi (mavjud notes ustiga yozilmaydi).
   */
  private async returnToRework(orderId: number, reason: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const note = reason && reason.trim().length > 0
        ? `[QC rework] ${reason.trim()}`
        : '[QC rework]';

      const upd = await db.execute<Row>(sql`
        UPDATE production_orders
        SET status = 'rework',
            notes = CASE
                      WHEN notes IS NULL OR notes = '' THEN ${note}
                      ELSE notes || E'\n' || ${note}
                    END,
            updated_at = NOW()
        WHERE id = ${orderId}
          AND deleted_at IS NULL
          AND status <> 'rework'
        RETURNING id
      `);
      const list = Array.isArray((upd as { rows?: Row[] }).rows)
        ? ((upd as { rows: Row[] }).rows)
        : (Array.isArray(upd) ? (upd as Row[]) : []);
      return list.length > 0;
    }, 'DB_ERROR');
  }
}
