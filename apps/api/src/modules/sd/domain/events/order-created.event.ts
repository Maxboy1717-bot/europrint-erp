/**
 * @module order-created.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class OrderCreatedEvent extends DomainEvent {
  readonly aggregateName: string = 'SalesOrder';

  constructor(
    public readonly orderId: number,
    public readonly companyId: number,
    public readonly orderNumber: string,
    public readonly totalAmount: number,
  ) {
    super(orderId, 'OrderCreated');
  }
}
