/**
 * @module pp-released.event
 * @description Domain event payload. Emitted via `eventBus.publish(new PpReleasedEvent(...))`
 *   when a production order is released to the shop floor (Trigger 8).
 *
 * PA2-18 (Wave 6): extracted from the inline `eventBus.publish({type: 'PP_RELEASED_TO_PRODUCTION', ...})`
 *   previously used by release-production-order.handler.ts so MM-side
 *   listeners can subscribe via canonical `@EventsHandler(PpReleasedEvent)`.
 */

export class PpReleasedEvent {
  constructor(
    public readonly poId: number,
    public readonly materialList: Array<{ materialId: number; quantity: number }>,
  ) {}
}
