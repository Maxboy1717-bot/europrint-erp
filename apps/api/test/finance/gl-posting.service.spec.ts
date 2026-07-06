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

function makeMockGlRepo(): jest.Mocked<IGlPostingRepository> {
  return {
    insertEntry: jest.fn().mockResolvedValue(Ok(1)),
    insertJournal: jest.fn().mockResolvedValue(Ok(1)),
    findEntryIdByReference: jest.fn().mockResolvedValue(Ok(null)),
    findClosedPeriodForDate: jest.fn().mockResolvedValue(Ok(null)),
    financeInvoiceExists: jest.fn().mockResolvedValue(Ok(true)),
    salesOrderExists: jest.fn().mockResolvedValue(Ok(true)),
  };
}

describe('GlPostingService', () => {
  let mockGlRepo: jest.Mocked<IGlPostingRepository>;
  let svc: GlPostingService;

  beforeEach(() => {
    mockGlRepo = makeMockGlRepo();
    svc = new GlPostingService(mockGlRepo);
  });

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

    // F2 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): a zero-amount posting used to return Ok() while
    // inserting nothing (insertJournal([])) — the exact shape of the POS-GL-1 garbage row (F1). It is
    // now rejected with a clear error instead of a silent no-op.
    it('rejects a zero-amount sales invoice instead of silently no-op-ing', async () => {
      const r = await svc.postSalesInvoice(3, 0, 0);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/EP-FIN-DATA-QUALITY/);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
    });

    // F2: the GL entry must trace to a real finance_invoices row.
    it('rejects a posting when the source finance_invoices row does not exist', async () => {
      mockGlRepo.financeInvoiceExists.mockResolvedValueOnce(Ok(false));
      const r = await svc.postSalesInvoice(999999, 1_000, 150);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/finance_invoices #999999 topilmadi/);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
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

    // F2: zero payments are no longer a silent no-op (see postSalesInvoice test above for root cause).
    it('rejects a zero payment instead of silently no-op-ing', async () => {
      const r = await svc.postCustomerPayment(12, 0);
      expect(r.ok).toBe(false);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
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

    // F2: zero vendor payments are no longer a silent no-op.
    it('rejects a zero vendor payment instead of silently no-op-ing', async () => {
      const r = await svc.postVendorPayment(31, 0);
      expect(r.ok).toBe(false);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
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

    // F2: a zero-gross "payroll" is a degenerate no-op, not a valid posting — now rejected.
    it('rejects a zero-gross payroll instead of silently no-op-ing', async () => {
      const r = await svc.postPayroll(52, 0);
      expect(r.ok).toBe(false);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
    });
  });

  describe('postDeliveryCompleted()', () => {
    it('posts a balanced 5-leg entry when the sales order exists', async () => {
      const r = await svc.postDeliveryCompleted(100, 10_000, 1_200, 4_000);
      expect(r.ok).toBe(true);
    });

    it('rejects when totalAmount <= 0 (pre-existing guard, unaffected by F2)', async () => {
      const r = await svc.postDeliveryCompleted(101, 0, 0, 0);
      expect(r.ok).toBe(false);
    });

    // F2: the GL entry must trace to a real sales_orders row — this is the exact gap that let the
    // POS-GL-1 garbage row (F1) post against a pending, zero-amount source movement.
    it('rejects a posting when the source sales_orders row does not exist', async () => {
      mockGlRepo.salesOrderExists.mockResolvedValueOnce(Ok(false));
      const r = await svc.postDeliveryCompleted(999999, 10_000, 1_200, 4_000);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/sales_orders #999999 topilmadi/);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
    });
  });

  describe('entry_date timezone — C3 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06)', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('resolves entry_date in Asia/Tashkent, not UTC, for a post in the 00:00-05:00 Tashkent window', async () => {
      // Real-world moment: 2026-07-06 02:00 in Tashkent (UTC+5) = 2026-07-05 21:00 UTC.
      // The old `new Date().toISOString().slice(0,10)` would read "2026-07-05" (still-UTC
      // previous day) — one calendar day behind the correct Tashkent date "2026-07-06".
      jest.useFakeTimers().setSystemTime(new Date('2026-07-05T21:00:00.000Z'));

      const r = await svc.postCustomerPayment(60, 1_000);

      expect(r.ok).toBe(true);
      expect(mockGlRepo.findClosedPeriodForDate).toHaveBeenCalledWith('2026-07-06');
    });

    it('still resolves the same Tashkent calendar day for a post well inside normal daytime hours', async () => {
      // 2026-07-06 14:00 Tashkent = 2026-07-06 09:00 UTC — both UTC and Tashkent agree on the
      // date here, so this proves the fix didn't break the non-boundary case.
      jest.useFakeTimers().setSystemTime(new Date('2026-07-06T09:00:00.000Z'));

      const r = await svc.postCustomerPayment(61, 1_000);

      expect(r.ok).toBe(true);
      expect(mockGlRepo.findClosedPeriodForDate).toHaveBeenCalledWith('2026-07-06');
    });
  });

  describe('postJournal() — generic path, unaffected source-check', () => {
    it('rejects a zero-total generic journal (no per-caller table to check, but amount gate still applies)', async () => {
      const r = await svc.postJournal(
        [
          { accountCode: '1000', accountName: 'A', debit: 0, credit: 0 },
          { accountCode: '2000', accountName: 'B', debit: 0, credit: 0 },
        ],
        'ADHOC-1',
      );
      expect(r.ok).toBe(false);
      expect(mockGlRepo.insertJournal).not.toHaveBeenCalled();
    });

    it('accepts a real balanced generic journal', async () => {
      const r = await svc.postJournal(
        [
          { accountCode: '1000', accountName: 'A', debit: 500, credit: 0 },
          { accountCode: '2000', accountName: 'B', debit: 0, credit: 500 },
        ],
        'ADHOC-2',
      );
      expect(r.ok).toBe(true);
    });
  });
});
