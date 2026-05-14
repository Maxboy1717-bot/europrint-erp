/**
 * @module deal-won.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event.base';

export class DealWonEvent extends DomainEvent {
  readonly aggregateName: string = 'Deal';

  constructor(
    public readonly dealId: number,
    public readonly companyId: number,
    public readonly totalAmount: number,
    public readonly assignedTo: number,
  ) {
    super(dealId, 'DealWon');
  }
}
