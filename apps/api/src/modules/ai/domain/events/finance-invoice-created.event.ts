/**
 * @module finance-invoice-created.event
 * @description Wave 4 round-3 (PA2-18): canonical CQRS event class for the
 *   `finance.invoice.created` topic. The AI automation listener was previously
 *   listening via `@OnEvent('finance.invoice.created')`; it now subscribes to
 *   this class.
 *
 *   Note: there is also `ERP_EVENTS.INVOICE_CREATED = 'fi.invoice.created'`
 *   in the constants file, but no publisher currently emits on either name —
 *   the listener was already a dead-letter prior to migration.
 */

import { DomainEvent } from '@shared/domain/domain-event';

export interface FinanceInvoiceCreatedEventProps {
  invoiceId: number;
  description: string;
  amount: number;
  vendor: string;
  userId: number;
}

export class FinanceInvoiceCreatedEvent extends DomainEvent {
  constructor(public readonly props: FinanceInvoiceCreatedEventProps) {
    super(String(props.invoiceId), 'FinanceInvoiceCreated');
  }
}
