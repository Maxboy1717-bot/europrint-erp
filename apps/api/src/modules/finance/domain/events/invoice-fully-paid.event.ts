import { DomainEvent } from '@shared/domain/domain-event';

export interface InvoiceFullyPaidEventProps {
  invoiceId: number;
  customerId: number;
  totalAmount: number;
  paidAt: Date;
}

export class InvoiceFullyPaidEvent extends DomainEvent {
  constructor(public readonly props: InvoiceFullyPaidEventProps) {
    super(props.invoiceId, 'InvoiceFullyPaid');
  }
}
