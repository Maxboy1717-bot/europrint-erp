/**
 * @module invoice-partially-paid.event
 * @description Domain event payload. Emitted via @nestjs/event-emitter or CQRS event bus.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface InvoicePartiallyPaidEventProps {
  invoiceId: number;
  customerId: number;
  paidAmount: number;
  totalPaid: number;
  remaining: number;
  paidAt: Date;
}

export class InvoicePartiallyPaidEvent extends DomainEvent {
  constructor(public readonly props: InvoicePartiallyPaidEventProps) {
    super(props.invoiceId, 'InvoicePartiallyPaid');
  }
}
