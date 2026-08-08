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
 *
 *   SB0279 fix (golden-thread outbox durability): the in-process `eventBus`
 *   publish above is NOT the only path — `update-order-status.handler.ts`
 *   also durably inserts `sd.order.status_changed` into the `domain_events`
 *   outbox in the SAME transaction as the status UPDATE. If the process
 *   crashes/restarts between the DB commit and the in-memory `eventBus.publish`
 *   call, the CQRS event is lost forever, but the outbox row survives and the
 *   `OutboxPublisher` re-emits it every 10s via `EventEmitter2.emit(row.event_name,
 *   row.payload)` — a STRING topic, not the typed CQRS class. Previously nothing
 *   subscribed to that string topic on the PP side, so replay was a no-op and
 *   the "durability" claimed in update-order-status.handler.ts's comment did not
 *   actually reach this listener. `handleReplayed` below closes that gap by
 *   subscribing to the same string topic the outbox publisher re-emits,
 *   reconstructing the same effect via the idempotent repo call (double-fire
 *   with the CQRS path is safe — `createPlanFromSalesOrder` skips if a PO
 *   already exists for the sales order).
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatusChangedEvent } from '@modules/sd/domain/events/order-status-changed.event';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';

/** SD status at which the order is confirmed and ready for production planning. */
const PLANNING_GATE_STATUS = 'ready_for_planning';

/** Shape of the outbox `payload` column written by update-order-status.handler.ts. */
interface OrderStatusChangedOutboxPayload {
  orderId?: unknown;
  previousStatus?: unknown;
  newStatus?: unknown;
}

@Injectable()
@EventsHandler(OrderStatusChangedEvent)
export class SalesOrderReadyPlanningListener
  implements IEventHandler<OrderStatusChangedEvent>
{
  private readonly logger = new Logger(SalesOrderReadyPlanningListener.name);

  constructor(@Inject(PP_REPO) private readonly ppRepo: IPpRepository) {}

  /**
   * SB0279 — outbox-replay fallback. Fires when `OutboxPublisher` re-emits a
   * durably-persisted `sd.order.status_changed` row that the in-process CQRS
   * publish never reached (crash/restart window). Reuses the same idempotent
   * planning path as `handle()` below.
   */
  @OnEvent(ERP_EVENTS.ORDER_STATUS_CHANGED)
  async handleReplayed(payload: OrderStatusChangedOutboxPayload): Promise<void> {
    const newStatus = typeof payload?.newStatus === 'string' ? payload.newStatus : undefined;
    if (newStatus !== PLANNING_GATE_STATUS) return;

    const salesOrderId = Number(payload?.orderId);
    if (!Number.isFinite(salesOrderId) || salesOrderId <= 0) {
      this.logger.warn(
        `SD→PP (outbox replay): invalid sales order id on replayed status_changed payload (${String(payload?.orderId)})`,
      );
      return;
    }

    this.logger.log({
      msg: 'SD→PP (outbox replay): sales order ready for planning — opening production plan',
      salesOrderId,
    });

    await this._openPlan(salesOrderId, 'SD→PP (outbox replay)');
  }

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

    await this._openPlan(salesOrderId, 'SD→PP');
  }

  /**
   * Shared idempotent planning step for both the live CQRS path (`handle`)
   * and the outbox-replay fallback (`handleReplayed`). #22 listener
   * resilience: best-effort — a thrown error from the repo must not
   * propagate to the event bus and abort sibling consumers.
   */
  private async _openPlan(salesOrderId: number, logPrefix: string): Promise<void> {
    try {
      const result = await this.ppRepo.createPlanFromSalesOrder(salesOrderId);
      if (!result.ok) {
        this.logger.error(
          { salesOrderId, error: result.error },
          `${logPrefix}: failed to create production plan from sales order`,
        );
        return;
      }

      this.logger.log(
        `${logPrefix}: production plan ready for sales order ${salesOrderId} (${result.data} order(s) opened)`,
      );
    } catch (error: unknown) {
      this.logger.error(
        { salesOrderId, error: (error as Error)?.message ?? String(error) },
        `${logPrefix}: exception opening production plan (golden-thread step SD→PP)`,
      );
    }
  }
}
