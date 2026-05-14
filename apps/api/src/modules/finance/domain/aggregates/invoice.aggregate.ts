/**
 * @module invoice.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event';
import { InvoiceFullyPaidEvent } from '../events/invoice-fully-paid.event';
import { InvoicePartiallyPaidEvent } from '../events/invoice-partially-paid.event';

export interface InvoiceProps {
  id: number;
  customerId: number;
  invoiceNumber: string;
  status: 'draft' | 'posted' | 'sent' | 'partial_paid' | 'full_paid' | 'overdue' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  dueDate: Date;
  createdAt: Date;
}

export class Invoice {
  private readonly logger = new Logger(Invoice.name);
  private events: DomainEvent[] = [];

  constructor(private props: InvoiceProps) {}

  static create(props: InvoiceProps): Invoice {
    return new Invoice(props);
  }

  get id(): number { return this.props.id; }
  get status(): string { return this.props.status; }
  get totalAmount(): number { return this.props.totalAmount; }
  get paidAmount(): number { return this.props.paidAmount; }

  get remainingAmount(): number {
    return this.props.totalAmount - this.props.paidAmount;
  }

  get isOverdue(): boolean {
    return _time.now() > this.props.dueDate && this.props.status !== 'full_paid';
  }

  markAsPartiallyPaid(amount: number): void {
    if (amount <= 0) {
      this.logger.warn(`Invalid payment amount: ${amount}`);
      return;
    }

    if (amount > this.remainingAmount) {
      this.logger.warn(
        `Payment amount ${amount} exceeds remaining amount ${this.remainingAmount}`
      );
      return;
    }

    this.props.paidAmount += amount;
    this.props.status = 'partial_paid';

    const event = new InvoicePartiallyPaidEvent({
      invoiceId: this.props.id,
      customerId: this.props.customerId,
      paidAmount: amount,
      totalPaid: this.props.paidAmount,
      remaining: this.remainingAmount,
      paidAt: _time.now(),
    });

    this.events.push(event);
    this.logger.debug(
      `Invoice marked as partially paid - ID: ${this.props.id}, Amount: ${amount}`
    );
  }

  markAsFullyPaid(finalAmount: number): void {
    if (finalAmount < this.remainingAmount) {
      this.logger.warn(
        `Final payment ${finalAmount} is less than remaining ${this.remainingAmount}`
      );
      return;
    }

    this.props.paidAmount = this.props.totalAmount;
    this.props.status = 'full_paid';

    const event = new InvoiceFullyPaidEvent({
      invoiceId: this.props.id,
      customerId: this.props.customerId,
      totalAmount: this.props.totalAmount,
      paidAt: _time.now(),
    });

    this.events.push(event);
    this.logger.log(
      `Invoice fully paid - ID: ${this.props.id}, Total: ${this.props.totalAmount}`
    );
  }

  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
