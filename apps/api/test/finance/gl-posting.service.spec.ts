/**
 * test/finance/gl-posting.service.spec.ts
 *
 * Unit tests for GlPostingService — pure double-entry journal builder.
 * Every method validates that debit-side total equals credit-side total
 * before returning a synthetic entry id (no DB).
 */

import { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import { Ok } from '../../src/common/result';
import type { IGlPostingRepository } from '../../src/modules/finance/domain/repositories/i-gl-posting.repo';

const mockGlRepo: IGlPostingRepository = {
  insertEntry: jest.fn().mockResolvedValue(Ok(1)),
};

describe('GlPostingService', () => {
  const svc = new GlPostingService(mockGlRepo);

  describe('postSalesInvoice()', () => {
    it('balances AR debit against revenue + tax credit', async () => {
      const r = await svc.postSalesInvoice(1, 1_000, 150);
      expect(r.ok).toBe(true);
      if (r.ok) expect(typeof r.data).toBe('number');
    });

    it('produces a non-negative entry id on success', async () => {
      const r = await svc.postSalesInvoice(42, 5_000, 600);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeGreaterThanOrEqual(0);
    });

    it('handles zero-tax sales invoice', async () => {
      const r = await svc.postSalesInvoice(2, 1_000, 0);
      expect(r.ok).toBe(true);
    });

    it('handles zero-amount sales invoice (technical edge)', async () => {
      const r = await svc.postSalesInvoice(3, 0, 0);
      expect(r.ok).toBe(true);
    });
  });

  describe('postCustomerPayment()', () => {
    it('balances cash debit against AR credit', async () => {
      const r = await svc.postCustomerPayment(10, 2_500);
      expect(r.ok).toBe(true);
    });

    it('large amounts still balance', async () => {
      const r = await svc.postCustomerPayment(11, 9_999_999.99);
      expect(r.ok).toBe(true);
    });

    it('zero payment is allowed', async () => {
      const r = await svc.postCustomerPayment(12, 0);
      expect(r.ok).toBe(true);
    });
  });

  describe('postGoodsReceipt()', () => {
    it('balances inventory debit against AP credit', async () => {
      const r = await svc.postGoodsReceipt(20, 3_000);
      expect(r.ok).toBe(true);
    });

    it('fractional amounts balance within tolerance', async () => {
      const r = await svc.postGoodsReceipt(21, 1234.56);
      expect(r.ok).toBe(true);
    });
  });

  describe('postVendorPayment()', () => {
    it('balances AP debit against cash credit', async () => {
      const r = await svc.postVendorPayment(30, 2_000);
      expect(r.ok).toBe(true);
    });

    it('zero vendor payment is allowed', async () => {
      const r = await svc.postVendorPayment(31, 0);
      expect(r.ok).toBe(true);
    });
  });

  describe('postMaterialConsumption()', () => {
    it('balances COGS debit against inventory credit', async () => {
      const r = await svc.postMaterialConsumption(40, 1_500);
      expect(r.ok).toBe(true);
    });

    it('handles large material consumption', async () => {
      const r = await svc.postMaterialConsumption(41, 50_000_000);
      expect(r.ok).toBe(true);
    });
  });

  describe('postPayroll()', () => {
    // ERP is gross-only: payroll GL = Dr Salary Expense (gross) / Cr Salary Payable (gross).
    // Tax (INPS/JSHD) legs are posted in 1C, not here, so the entry always balances.
    it('posts a balanced gross-only entry (Dr Salary Expense = Cr Salary Payable)', async () => {
      const r = await svc.postPayroll(50, 1_000);
      expect(r.ok).toBe(true);
    });

    it('balances for any gross amount', async () => {
      const r = await svc.postPayroll(53, 5_000);
      expect(r.ok).toBe(true);
    });

    it('zero gross still balances (degenerate but valid)', async () => {
      const r = await svc.postPayroll(52, 0);
      expect(r.ok).toBe(true);
    });
  });
});
