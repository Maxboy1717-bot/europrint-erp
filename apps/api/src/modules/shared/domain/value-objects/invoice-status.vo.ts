/**
 * @module invoice-status.vo
 * @description Enumerated invoice lifecycle status. The set is fixed by the
 *   business state machine: draft -> posted/sent -> partial_paid -> full_paid,
 *   with overdue and cancelled as terminal/parallel states.
 * @layer Domain (shared)
 */

import { Result, Ok, Err, AppErr, AppError } from '@common/types/result.type';

export type InvoiceStatusValue =
  | 'draft'
  | 'posted'
  | 'sent'
  | 'partial_paid'
  | 'full_paid'
  | 'overdue'
  | 'cancelled';

const ALL: ReadonlySet<InvoiceStatusValue> = new Set([
  'draft', 'posted', 'sent', 'partial_paid', 'full_paid', 'overdue', 'cancelled',
]);

export class InvoiceStatus {
  private constructor(public readonly value: InvoiceStatusValue) {}

  static of(raw: string): Result<InvoiceStatus, AppError> {
    if (!raw || typeof raw !== 'string' || !ALL.has(raw as InvoiceStatusValue)) {
      return Err(AppErr('VALIDATION', `Invalid invoice status: ${raw}`));
    }
    return Ok(new InvoiceStatus(raw as InvoiceStatusValue));
  }

  static draft():        InvoiceStatus { return new InvoiceStatus('draft'); }
  static posted():       InvoiceStatus { return new InvoiceStatus('posted'); }
  static partialPaid():  InvoiceStatus { return new InvoiceStatus('partial_paid'); }
  static fullPaid():     InvoiceStatus { return new InvoiceStatus('full_paid'); }
  static cancelled():    InvoiceStatus { return new InvoiceStatus('cancelled'); }

  isPaid():            boolean { return this.value === 'full_paid'; }
  isPartiallyPaid():   boolean { return this.value === 'partial_paid'; }
  isCancelled():       boolean { return this.value === 'cancelled'; }

  equals(other: InvoiceStatus | null | undefined): boolean {
    return !!other && this.value === other.value;
  }

  toString(): string { return this.value; }
}
