/**
 * @module stock-updated.event
 * @description Domain event payload. Emitted via `eventBus.publish(new StockUpdatedEvent(...))`
 *   whenever a stock movement changes on-hand balance — the ROP trigger
 *   subscribes to decide whether to auto-create a purchase requisition.
 *
 * PA2-18 (Wave 6): extracted from the inline string-keyed
 *   `emitter.emit(ERP_EVENTS.STOCK_UPDATED, ...)` previously used by
 *   pos/stock-ledger.service.ts so the WMS ROP listener can subscribe via
 *   canonical `@EventsHandler(StockUpdatedEvent)`.
 */

export class StockUpdatedEvent {
  constructor(
    public readonly materialId: number,
    public readonly newOnHand: number,
  ) {}
}
