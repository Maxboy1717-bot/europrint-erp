/**
 * @module order-material-waiting.listener
 * @description SD→MM material-waiting signal handler (golden-thread extension, T8-07).
 *
 * Listens for `OrderMaterialWaitingEvent`, published by SD's
 * AdvanceApprovedFanoutListener the moment an order's warehouse material
 * requirement is created (ow_material_requirements, status 'NEEDED'). This is
 * the MM (procurement) end of the signal: it makes the waiting order VISIBLE to
 * the purchase manager so material can be sourced, instead of the requirement
 * sitting in 'NEEDED' with nobody alerted.
 *
 * WHY hitl_approvals (NOT a purchase requisition)
 *   At this point the order's material is still 'TBD' with quantity 0 — the
 *   warehouse/buyer has not yet chosen the concrete roll (ow_material_requirements
 *   seeds material_id='TBD', qty_required=0). The canonical procurement table
 *   `purchase_requisitions` requires a concrete material_id (int, NOT NULL),
 *   required_quantity (NOT NULL) and required_date (NOT NULL) — inventing those
 *   would be fabrication (Q-40 forbidden). So this signal is recorded as an
 *   order-level review-queue item in `hitl_approvals` (entity_type
 *   ='order_material_waiting'), exactly the pattern ThreeWayMatchFailedListener
 *   already uses for an order/PO-level review. The purchase-manager / director
 *   dashboard surfaces it; once the buyer picks the material, the normal
 *   requisition/PO flow (ROP trigger, manual req) takes over with real data.
 *
 * IDEMPOTENCY
 *   hitl_approvals has no unique key, so re-firing is guarded at the application
 *   layer: a NOT EXISTS check on (entity_type, entity_id=orderId, status pending)
 *   means a second signal for the same waiting order does NOT create a duplicate
 *   review item. This matches the at-least-once delivery of the outbox publisher.
 *
 * WHY NO Result<T> RETURN
 *   Event handlers are fire-and-forget. All failures are caught + logged so a
 *   write hiccup never crashes the event loop or the SD fan-out that emitted it.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { OrderMaterialWaitingEvent } from '@modules/sd/domain/events/order-material-waiting.event';

/** hitl_approvals.entity_type for the SD→MM material-waiting review item. */
const ENTITY_TYPE = 'order_material_waiting';

@Injectable()
@EventsHandler(OrderMaterialWaitingEvent)
export class OrderMaterialWaitingListener implements IEventHandler<OrderMaterialWaitingEvent> {
  private readonly logger = new Logger(OrderMaterialWaitingListener.name);

  async handle(event: OrderMaterialWaitingEvent): Promise<void> {
    const orderId = Number(event?.orderId);
    if (!orderId) return;

    const entityId = String(orderId);
    const note =
      `Buyurtma #${orderId} material kutmoqda — ${event.requirementCount} ta material talabi (NEEDED). ` +
      `Xarid menejeri material/rulonni tanlab ta'minlasin.`;

    try {
      // Idempotent: one pending review item per waiting order.
      const res = await db.execute(sql`
        INSERT INTO hitl_approvals (entity_type, entity_id, status, requested_by, notes, created_at, updated_at)
        SELECT ${ENTITY_TYPE}, ${entityId}, 'pending', NULL, ${note}, NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM hitl_approvals
          WHERE entity_type = ${ENTITY_TYPE} AND entity_id = ${entityId} AND status = 'pending'
        )
        RETURNING id
      `);
      const created = (res.rows ?? []).length > 0;
      this.logger.log({
        msg: 'SD→MM material-waiting signal received — procurement review item '
          + (created ? 'created' : 'already pending (idempotent)'),
        orderId,
        requirementCount: event.requirementCount,
      });
    } catch (e) {
      this.logger.error({
        msg: 'SD→MM material-waiting: hitl_approvals insert failed',
        orderId,
        error: (e as Error)?.message,
      });
    }
  }
}
