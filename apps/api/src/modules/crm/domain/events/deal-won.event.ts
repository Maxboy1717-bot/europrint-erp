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
    public readonly currency: string = 'UZS',
    // T18-C3: live crm_deals.id is a uuid (numeric dealId is a degraded cast).
    // dealUuid carries the real key so the SD listener can write the SO link
    // back (crm_deals.sales_order_id). Optional → legacy publishers unaffected.
    public readonly dealUuid?: string,
  ) {
    super(dealId, 'DealWon');
  }
}
