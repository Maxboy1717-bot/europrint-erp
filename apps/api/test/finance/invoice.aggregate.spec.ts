/**
 * @module test/finance/invoice.aggregate.spec
 * @description Unit tests for the Invoice aggregate — covers happy paths and
 * defensive error branches for partial / full payment transitions plus
 * remaining-amount + overdue derivations and domain-event emission.
 */

import { Invoice, InvoiceProps } from '../../src/modules/finance/domain/aggregates/invoice.aggregate';
import { InvoicePartiallyPaidEvent } from '../../src/modules/finance/domain/events/invoice-partially-paid.event';
import { InvoiceFullyPaidEvent } from '../../src/modules/finance/domain/events/invoice-fully-paid.event';

function makeInvoice(overrides: Partial<InvoiceProps> = {}): Invoice {
  const base: InvoiceProps = {
    id: 1001,
    customerId: 42,
    invoiceNumber: 'INV-2026-0001',
    status: 'posted',
    totalAmount: 1_000_000,
    paidAmount: 0,
    dueDate: new Date('2099-12-31'),
    createdAt: new Date('2026-05-01'),
  };
  return Invoice.create({ ...base, ...overrides });
}

describe('Invoice.create', () => {
  it('initialises identity when called with valid props', () => {
    const inv = makeInvoice({ id: 7, totalAmount: 500_000, paidAmount: 0 });
    expect(inv.id).toBe(7);
    expect(inv.status).toBe('posted');
    expect(inv.totalAmount).toBe(500_000);
    expect(inv.paidAmount).toBe(0);
  });

  it('exposes zero remainingAmount when total equals paid', () => {
    const inv = makeInvoice({ totalAmount: 250_000, paidAmount: 250_000 });
    expect(inv.remainingAmount).toBe(0);
  });

  it('reports remaining balance when partially paid in props', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000, paidAmount: 300_000 });
    expect(inv.remainingAmount).toBe(700_000);
  });
});

describe('Invoice.markAsPartiallyPaid', () => {
  it('increments paid amount when payment is below remaining', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000 });
    inv.markAsPartiallyPaid(300_000);
    expect(inv.paidAmount).toBe(300_000);
    expect(inv.remainingAmount).toBe(700_000);
    expect(inv.status).toBe('partial_paid');
  });

  it('emits InvoicePartiallyPaidEvent when payment is accepted', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000 });
    inv.markAsPartiallyPaid(400_000);
    const events = inv.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InvoicePartiallyPaidEvent);
    const ev = events[0] as InvoicePartiallyPaidEvent;
    expect(ev.props.paidAmount).toBe(400_000);
    expect(ev.props.totalPaid).toBe(400_000);
    expect(ev.props.remaining).toBe(600_000);
  });

  it('accumulates total paid amount when called sequentially', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000 });
    inv.markAsPartiallyPaid(200_000);
    inv.markAsPartiallyPaid(150_000);
    expect(inv.paidAmount).toBe(350_000);
    expect(inv.getDomainEvents()).toHaveLength(2);
  });

  it('ignores payment when amount is zero', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000 });
    inv.markAsPartiallyPaid(0);
    expect(inv.paidAmount).toBe(0);
    expect(inv.status).toBe('posted');
    expect(inv.getDomainEvents()).toHaveLength(0);
  });

  it('ignores payment when amount is negative', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000 });
    inv.markAsPartiallyPaid(-500);
    expect(inv.paidAmount).toBe(0);
    expect(inv.getDomainEvents()).toHaveLength(0);
  });

  it('rejects payment when amount exceeds remaining balance', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000, paidAmount: 800_000 });
    inv.markAsPartiallyPaid(500_000);
    expect(inv.paidAmount).toBe(800_000);
    expect(inv.getDomainEvents()).toHaveLength(0);
  });
});

describe('Invoice.markAsFullyPaid', () => {
  it('closes invoice when final payment matches remaining amount', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000, paidAmount: 600_000 });
    inv.markAsFullyPaid(400_000);
    expect(inv.status).toBe('full_paid');
    expect(inv.paidAmount).toBe(1_000_000);
    expect(inv.remainingAmount).toBe(0);
  });

  it('emits InvoiceFullyPaidEvent when invoice is closed', () => {
    const inv = makeInvoice({ totalAmount: 750_000 });
    inv.markAsFullyPaid(750_000);
    const events = inv.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(InvoiceFullyPaidEvent);
    const ev = events[0] as InvoiceFullyPaidEvent;
    expect(ev.props.totalAmount).toBe(750_000);
    expect(ev.props.invoiceId).toBe(1001);
  });

  it('accepts overpayment when final amount exceeds remaining', () => {
    const inv = makeInvoice({ totalAmount: 500_000, paidAmount: 100_000 });
    inv.markAsFullyPaid(600_000);
    expect(inv.status).toBe('full_paid');
    expect(inv.paidAmount).toBe(500_000);
  });

  it('rejects final payment when amount is below remaining', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000, paidAmount: 200_000 });
    inv.markAsFullyPaid(500_000);
    expect(inv.status).toBe('posted');
    expect(inv.paidAmount).toBe(200_000);
    expect(inv.getDomainEvents()).toHaveLength(0);
  });
});

describe('Invoice.isOverdue', () => {
  it('returns true when due date is in the past and invoice is not paid', () => {
    const inv = makeInvoice({ dueDate: new Date('2020-01-01'), status: 'posted' });
    expect(inv.isOverdue).toBe(true);
  });

  it('returns false when due date is in the future', () => {
    const inv = makeInvoice({ dueDate: new Date('2099-01-01') });
    expect(inv.isOverdue).toBe(false);
  });

  it('returns false when invoice is fully paid even if due date passed', () => {
    const inv = makeInvoice({
      dueDate: new Date('2020-01-01'),
      status: 'full_paid',
      paidAmount: 1_000_000,
    });
    expect(inv.isOverdue).toBe(false);
  });
});

describe('Invoice.clearDomainEvents', () => {
  it('removes all events when clearDomainEvents is invoked', () => {
    const inv = makeInvoice({ totalAmount: 1_000_000 });
    inv.markAsPartiallyPaid(100_000);
    inv.markAsPartiallyPaid(100_000);
    expect(inv.getDomainEvents()).toHaveLength(2);
    inv.clearDomainEvents();
    expect(inv.getDomainEvents()).toHaveLength(0);
  });
});
