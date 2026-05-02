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
