/**
 * @module sales-order-ready-planning.listener
 * @description Golden-thread SD→PP ENTRY. When a sales order is confirmed by the
 *   manager and transitions to `ready_for_planning`, PP must pick it up and open a
 *   production plan (production order / MPS line) referencing the sales_order_id.
 *
 *   Before this listener the entry was BROKEN: `AdvanceApprovedListener` only ran
 *   `unlockPlanning` which UPDATEs *already-existing* production orders by
 *   sales_order_id — so if no PO had ever been created (the normal case for a fresh
 *   order) it matched 0 rows and the chain dead-ended. Nothing turned a confirmed
 *   sales order into a production plan.
 *
 *   Canonical decision (master vision Q2): PP plans off `sales_orders` (the table the
 *   manager writes). This listener reuses the existing PP repo / production_orders
 *   table — no new table, no duplicate plan-creation path. Idempotent: the repo skips
 *   if a production order already references the sales order.
 *
 *   Subscribes to the typed CQRS event class (same pattern as the logistics
 *   `OrderStatusChangedDeliveryListener`), so it fires on the in-process
 *   `eventBus.publish(new OrderStatusChangedEvent(...))` from
 *   sd/application/commands/update-order-status.handler.ts.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderStatusChangedEvent } from '@modules/sd/domain/events/order-status-changed.event';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';

/** SD status at which the order is confirmed and ready for production planning. */
const PLANNING_GATE_STATUS = 'ready_for_planning';

@Injectable()
@EventsHandler(OrderStatusChangedEvent)
export class SalesOrderReadyPlanningListener
  implements IEventHandler<OrderStatusChangedEvent>
{
  private readonly logger = new Logger(SalesOrderReadyPlanningListener.name);

  constructor(@Inject(PP_REPO) private readonly ppRepo: IPpRepository) {}

  async handle(event: OrderStatusChangedEvent): Promise<void> {
    // Only act on the confirm→plan transition. Every other status change is a no-op.
    if (event.newStatus !== PLANNING_GATE_STATUS) return;

    const salesOrderId = Number(event.orderId);
    if (!Number.isFinite(salesOrderId) || salesOrderId <= 0) {
      this.logger.warn(
        `SD→PP: invalid sales order id on OrderStatusChangedEvent (${String(event.orderId)})`,
      );
      return;
    }

    this.logger.log({
      msg: 'SD→PP: sales order ready for planning — opening production plan',
      salesOrderId,
      previousStatus: event.previousStatus,
    });

    // #22 listener resilience: best-effort. The SD status change already committed
    // upstream; a thrown error from the repo (before it can return a Result) must not
    // propagate to the event bus and abort sibling OrderStatusChanged consumers. Catch
    // + structured-log so the golden-thread step is observable without crashing the bus.
    try {
      const result = await this.ppRepo.createPlanFromSalesOrder(salesOrderId);
      if (!result.ok) {
        this.logger.error(
          { salesOrderId, error: result.error },
          'SD→PP: failed to create production plan from sales order',
        );
        return;
      }

      this.logger.log(
        `SD→PP: production plan ready for sales order ${salesOrderId} (${result.data} order(s) opened)`,
      );
    } catch (error: unknown) {
      this.logger.error(
        { salesOrderId, error: (error as Error)?.message ?? String(error) },
        'SD→PP: exception opening production plan (golden-thread step SD→PP)',
      );
    }
  }
}
