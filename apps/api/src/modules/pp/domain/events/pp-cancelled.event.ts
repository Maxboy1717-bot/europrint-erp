/**
 * @module pp-cancelled.event
 * @description Domain event payload. Emitted via `eventBus.publish(new PpCancelledEvent(...))`
 *   when a production order (planning operation) is cancelled, so the linked
 *   sales order can be put on hold in SD. Fixes a golden-thread gap: cancelling
 *   a production order previously never notified sales_orders (PATCH
 *   /planning/operations/:id silently updated production_orders only).
 *
 *   Published from `pp-planning.service.ts` after a successful
 *   `updateOperation(id, { status: 'cancelled' })`, using the `sales_order_id`
 *   already present on the repo's `RETURNING *` row. `salesOrderId` is only
 *   ever a positive integer — the publisher guards against null/0 before
 *   constructing this event.
 */

export class PpCancelledEvent {
  constructor(
    public readonly poId: number,
    public readonly salesOrderId: number,
  ) {}
}
