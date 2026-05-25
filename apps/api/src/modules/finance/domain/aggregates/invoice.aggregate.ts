/**
 * @module invoice.aggregate
 * @description Invoice aggregate root.
 *
 *   DDD C.20/C.21 refactor: monetary fields now live on a `Money` VO (amount
 *   + currency) and a dedicated `InvoiceStatus` VO. State-changing methods
 *   return `Result<void, DomainError>` instead of silently logging-and-
 *   returning on invalid input. The legacy `markAsPartiallyPaid` / `markAs-
 *   FullyPaid` signatures are kept as deprecated thin wrappers so existing
 *   callers (e.g. `record-payment.handler`) keep working until they migrate.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event';
import { InvoiceFullyPaidEvent } from '../events/invoice-fully-paid.event';
import { InvoicePartiallyPaidEvent } from '../events/invoice-partially-paid.event';
import { Money } from '@shared/domain/value-objects/money.vo';
import { Currency } from '@shared/domain/value-objects/currency.vo';
import { InvoiceStatus, InvoiceStatusValue } from '@shared/domain/value-objects/invoice-status.vo';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';

/**
 * Back-compat shape with primitive numbers + string status. New code should
 * use `InvoiceCreateInput` and `Invoice.createFromVO`.
 */
export interface InvoiceProps {
  id: number;
  customerId: number;
  invoiceNumber: string;
  status: InvoiceStatusValue;
  totalAmount: number;
  paidAmount: number;
  dueDate: Date;
  createdAt: Date;
  /** Optional — defaults to UZS for legacy callers. */
  currency?: string;
}

export interface InvoiceCreateInput {
  id: number;
  customerId: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: Money;
  paid: Money;
  dueDate: Date;
  createdAt: Date;
}

/**
 * Internal VO-typed state. Hydrated from either factory path. Direct field
 * mutation is forbidden — go through the Result-returning methods below.
 */
interface InternalState {
  id: number;
  customerId: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: Money;
  paid: Money;
  dueDate: Date;
  createdAt: Date;
}

export class Invoice {
  private readonly logger = new Logger(Invoice.name);
  private events: DomainEvent[] = [];
  private state: InternalState;

  private constructor(state: InternalState) {
    this.state = state;
  }

  /**
   * Legacy factory — accepts primitives. Uses `Money.ofOrThrow` for back-compat
   * because callers previously couldn't observe a Result. Prefer
   * `Invoice.createFromVO` in new code.
   */
  static create(props: InvoiceProps): Invoice {
    const currency = props.currency ?? 'UZS';
    return new Invoice({
      id:            props.id,
      customerId:    props.customerId,
      invoiceNumber: props.invoiceNumber,
      status:        InvoiceStatus.of(props.status).ok ? (InvoiceStatus.of(props.status) as { ok: true; data: InvoiceStatus }).data : InvoiceStatus.draft(),
      total:         Money.ofOrThrow(props.totalAmount, currency),
      paid:          Money.ofOrThrow(props.paidAmount, currency),
      dueDate:       props.dueDate,
      createdAt:     props.createdAt,
    });
  }

  /**
   * VO-first factory. All inputs already validated by their respective VO
   * factories. Fails when `total` and `paid` carry different currencies.
   */
  static createFromVO(input: InvoiceCreateInput): Result<Invoice> {
    if (input.total.currency !== input.paid.currency) {
      return Err(AppErr(
        'VALIDATION',
        `Currency mismatch on invoice: total=${input.total.currency} paid=${input.paid.currency}`,
      ));
    }
    return Ok(new Invoice({
      id:            input.id,
      customerId:    input.customerId,
      invoiceNumber: input.invoiceNumber,
      status:        input.status,
      total:         input.total,
      paid:          input.paid,
      dueDate:       input.dueDate,
      createdAt:     input.createdAt,
    }));
  }

  // -- Accessors --

  get id(): number { return this.state.id; }
  get status(): string { return this.state.status.value; }
  get statusVO(): InvoiceStatus { return this.state.status; }
  get totalAmount(): number { return this.state.total.amount; }
  get paidAmount(): number { return this.state.paid.amount; }
  get currency(): string { return this.state.total.currency; }
  get totalMoney(): Money { return this.state.total; }
  get paidMoney(): Money { return this.state.paid; }

  get remainingAmount(): number {
    return this.state.total.amount - this.state.paid.amount;
  }

  /** Remaining as `Money` — undefined on subtraction error (e.g. overpaid). */
  get remainingMoney(): Money | undefined {
    const r = this.state.total.subtract(this.state.paid);
    return r.ok ? r.data : undefined;
  }

  get isOverdue(): boolean {
    return _time.now() > this.state.dueDate && !this.state.status.isPaid();
  }

  // -- Result-returning state transitions (C.21) --

  /**
   * Apply a partial payment. Replaces the previous `void` signature; callers
   * now check `.ok` before proceeding.
   */
  markAsPartiallyPaid(amount: number): Result<void> {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return Err(AppErr('VALIDATION', `Invalid payment amount: ${amount}`));
    }
    if (amount <= 0) {
      return Err(AppErr('VALIDATION', `Payment amount must be > 0 (got ${amount})`));
    }
    if (amount > this.remainingAmount) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Payment ${amount} exceeds remaining ${this.remainingAmount}`,
      ));
    }
    const paymentR = Money.of(amount, this.state.total.currency);
    if (!paymentR.ok) return Err(paymentR.error);
    const newPaidR = this.state.paid.add(paymentR.data);
    if (!newPaidR.ok) return Err(newPaidR.error);

    this.state.paid = newPaidR.data;
    this.state.status = InvoiceStatus.partialPaid();

    this.events.push(new InvoicePartiallyPaidEvent({
      invoiceId:  this.state.id,
      customerId: this.state.customerId,
      paidAmount: amount,
      totalPaid:  this.state.paid.amount,
      remaining:  this.remainingAmount,
      paidAt:     _time.now(),
    }));
    this.logger.debug(`Invoice ${this.state.id}: +${amount} ${this.state.total.currency}`);
    return Ok(undefined);
  }

  /**
   * Mark as fully paid. Returns Err when the final amount is below the
   * remaining balance — previously this would silent-log and return.
   */
  markAsFullyPaid(finalAmount: number): Result<void> {
    if (typeof finalAmount !== 'number' || !Number.isFinite(finalAmount)) {
      return Err(AppErr('VALIDATION', `Invalid final amount: ${finalAmount}`));
    }
    if (finalAmount < this.remainingAmount) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Final payment ${finalAmount} is less than remaining ${this.remainingAmount}`,
      ));
    }

    this.state.paid = this.state.total;
    this.state.status = InvoiceStatus.fullPaid();

    this.events.push(new InvoiceFullyPaidEvent({
      invoiceId:   this.state.id,
      customerId:  this.state.customerId,
      totalAmount: this.state.total.amount,
      paidAt:      _time.now(),
    }));
    this.logger.log(`Invoice ${this.state.id} fully paid (${this.state.total.toString()})`);
    return Ok(undefined);
  }

  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
