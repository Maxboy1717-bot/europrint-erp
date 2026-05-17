/**
 * invoice-status.vo.spec.ts — InvoiceStatus value object tests (DDD C.20).
 */

import { InvoiceStatus } from '../../src/modules/shared/domain/value-objects/invoice-status.vo';

describe('InvoiceStatus value object', () => {
  it('accepts the canonical lifecycle values', () => {
    for (const v of ['draft', 'posted', 'sent', 'partial_paid', 'full_paid', 'overdue', 'cancelled']) {
      const r = InvoiceStatus.of(v);
      expect(r.ok).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    const r = InvoiceStatus.of('archived');
    expect(r.ok).toBe(false);
  });

  it('rejects empty / null input', () => {
    const r = InvoiceStatus.of('');
    expect(r.ok).toBe(false);
  });

  it('isPaid only true for full_paid', () => {
    expect(InvoiceStatus.fullPaid().isPaid()).toBe(true);
    expect(InvoiceStatus.partialPaid().isPaid()).toBe(false);
    expect(InvoiceStatus.draft().isPaid()).toBe(false);
  });

  it('isPartiallyPaid only true for partial_paid', () => {
    expect(InvoiceStatus.partialPaid().isPartiallyPaid()).toBe(true);
    expect(InvoiceStatus.fullPaid().isPartiallyPaid()).toBe(false);
  });

  it('equals compares by underlying value', () => {
    expect(InvoiceStatus.draft().equals(InvoiceStatus.draft())).toBe(true);
    expect(InvoiceStatus.draft().equals(InvoiceStatus.posted())).toBe(false);
    expect(InvoiceStatus.draft().equals(null)).toBe(false);
  });
});
