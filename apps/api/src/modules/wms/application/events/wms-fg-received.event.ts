/**
 * @module wms-fg-received.event
 * @description Domain event payload. Emitted via `eventBus.publish(new WmsFgReceivedEvent(...))`
 *   when finished goods are received in the warehouse (Trigger 12).
 *
 * PA2-18 (Wave 6): extracted from the inline string-keyed publish previously
 *   used by receive-fg.handler.ts so finance-side rental-timer listener can
 *   subscribe via canonical `@EventsHandler(WmsFgReceivedEvent)`.
 */

export class WmsFgReceivedEvent {
  constructor(
    public readonly materialId: number,
    public readonly amount: number,
    public readonly warehouseId: number,
    public readonly timestamp: Date,
    public readonly orderId?: number,
    public readonly areaM2?: number,
  ) {}
}
