/**
 * test/finance/finance-ar-ap.repository.created-by.spec.ts
 *
 * F5 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): finance_invoices.created_by/approved_by columns
 * were added, but the Drizzle `pgTable()` definition for finance_invoices (schema-ext-b-3.ts)
 * did NOT originally declare them — the exact "Drizzle schema column-name drift" pattern seen
 * elsewhere this session, where a live column exists but the ORM silently drops it on insert
 * with no error. This test protects the fix: created_by must actually reach the values() call
 * Drizzle sends to the DB, not just be accepted as a DTO field and dropped.
 */

const mockValues = jest.fn(() => ({ returning: jest.fn().mockResolvedValue([{ id: 1 }]) }));
const mockInsert = jest.fn(() => ({ values: mockValues }));

jest.mock('@shared/db', () => ({
  db: { insert: mockInsert, transaction: jest.fn(), select: jest.fn(), update: jest.fn() },
  finance_invoices: { id: 'id' },
  ar_aging_buckets: {},
  ap_aging_buckets: {},
}));

import { FinanceArRepository } from '../../src/modules/finance/infrastructure/repositories/finance-ar.repository';
import { FinanceApRepository } from '../../src/modules/finance/infrastructure/repositories/finance-ap.repository';

describe('finance_invoices created_by — F5 Drizzle schema-drift guard', () => {
  beforeEach(() => {
    mockValues.mockClear();
    mockInsert.mockClear();
  });

  it('FinanceArRepository.createArEntry passes created_by into the Drizzle values() call', async () => {
    const repo = new FinanceArRepository();
    await repo.createArEntry({ customerId: 5, amount: 1000, createdBy: 42 });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: 42 }),
    );
  });

  it('FinanceArRepository.createArEntry passes created_by=null when not supplied', async () => {
    const repo = new FinanceArRepository();
    await repo.createArEntry({ amount: 1000 });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: null }),
    );
  });

  it('FinanceApRepository.createApEntry passes created_by into the Drizzle values() call', async () => {
    const repo = new FinanceApRepository();
    await repo.createApEntry({ vendorId: 7, amount: 2000, createdBy: 99 });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: 99 }),
    );
  });
});
