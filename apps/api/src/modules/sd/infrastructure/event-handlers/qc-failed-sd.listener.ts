/**
 * @module qc-failed-sd.listener
 * @description 06-sd#35 — QC_HOLD holati. QcFailedEvent (qc/domain/events)
 *   {inspectionId, orderId, reason} — orderId = production_orders.id (tasdiqlangan:
 *   pp/infrastructure/event-handlers/qc-rework.listener.ts:9 izohi). Bu listener
 *   production_orders.sales_order_id orqali bog'liq sotuv buyurtmasini topib,
 *   uni 'QC_HOLD' holatiga o'tkazadi — xuddi shu shakl pp-cancelled-sd.listener.ts
 *   bilan (idempotent, faqat terminal-bo'lmagan holatda).
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { QcFailedEvent } from '@modules/qc/domain/events';

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedSdListener implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcFailedSdListener.name);

  async handle(event: QcFailedEvent): Promise<void> {
    const { inspectionId, orderId: productionOrderId, reason } = event;

    try {
      const linked = await runQuery<{ sales_order_id: number | null }>(sql`
        SELECT sales_order_id FROM production_orders WHERE id = ${productionOrderId}
      `);
      const salesOrderId = linked.rows[0]?.sales_order_id;
      if (!salesOrderId) {
        this.logger.log({
          msg: 'QcFailedEvent: production order has no linked sales order — skipping (idempotent no-op)',
          inspectionId, productionOrderId,
        });
        return;
      }

      const result = await runQuery<{ id: number }>(sql`
        UPDATE sales_orders
        SET status = 'QC_HOLD', updated_at = NOW()
        WHERE id = ${salesOrderId}
          AND status NOT IN ('cancelled', 'delivered', 'closed')
        RETURNING id
      `);

      const updated = Array.isArray(result.rows) ? result.rows.length > 0 : false;
      if (updated) {
        this.logger.log({
          msg: 'Sales order put on QC_HOLD after linked QC inspection failed',
          inspectionId, productionOrderId, salesOrderId, reason,
        });
      } else {
        this.logger.log({
          msg: 'Sales order not updated (already terminal, or no matching row) — idempotent no-op',
          inspectionId, productionOrderId, salesOrderId,
        });
      }
    } catch (error: unknown) {
      this.logger.error({
        msg: 'Failed to put sales order on QC_HOLD after QC inspection failure',
        inspectionId, productionOrderId,
        error: (error as Error).message,
      });
    }
  }
}
