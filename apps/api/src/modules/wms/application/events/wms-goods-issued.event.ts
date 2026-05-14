/**
 * @module wms-goods-issued.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

export class WmsGoodsIssuedEvent {
  constructor(public readonly payload: Record<string, unknown>) {}
}
