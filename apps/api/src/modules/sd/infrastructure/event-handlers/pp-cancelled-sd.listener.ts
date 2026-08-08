/**
 * @module pp-cancelled-sd.listener
 * @description Canonical CQRS @EventsHandler form (same shape as DealWonListener /
 *   PaymentReceivedListener). Reacts to `PpCancelledEvent` (published by
 *   `PpPlanningService.updateOperation` when a planning operation is set to
 *   'cancelled') and puts the linked sales order on hold so SD/CRM see that
 *   production stopped.
 *
 *   Golden-thread gap fix: previously PATCH /planning/operations/:id with
 *   status='cancelled' only updated production_orders — sales_orders never
 *   found out. This listener is the SD-side half of that fix.
 *
 *   Idempotent + guarded: the UPDATE only fires when the sales order is not
 *   already in a terminal/settled state (cancelled/delivered/closed), so a
 *   re-published event (or an event arriving after the order has already
 *   moved on) is a safe no-op.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { PpCancelledEvent } from '@modules/pp/domain/events/pp-cancelled.event';

@Injectable()
@EventsHandler(PpCancelledEvent)
export class PpCancelledSdListener implements IEventHandler<PpCancelledEvent> {
  private readonly logger = new Logger(PpCancelledSdListener.name);

  async handle(event: PpCancelledEvent): Promise<void> {
    const { poId, salesOrderId } = event;

    if (!Number.isFinite(salesOrderId) || salesOrderId <= 0) {
      this.logger.warn({ msg: 'PpCancelledEvent missing a valid salesOrderId — skipping', poId, salesOrderId });
      return;
    }

    try {
      const result = await runQuery<{ id: number }>(sql`
        UPDATE sales_orders
        SET status = 'on_hold', updated_at = NOW()
        WHERE id = ${salesOrderId}
          AND status NOT IN ('cancelled', 'delivered', 'closed')
        RETURNING id
      `);

      const updated = Array.isArray(result.rows) ? result.rows.length > 0 : false;
      if (updated) {
        this.logger.log({
          msg: 'Sales order put on hold after linked production order was cancelled',
          poId,
          salesOrderId,
        });
      } else {
        this.logger.log({
          msg: 'Sales order not updated (already terminal, or no matching row) — idempotent no-op',
          poId,
          salesOrderId,
        });
      }
    } catch (error: unknown) {
      this.logger.error({
        msg: 'Failed to put sales order on hold after production order cancellation',
        poId,
        salesOrderId,
        error: (error as Error).message,
      });
    }
  }
}
