/**
 * test/finance/drizzle-finance-gl.repo.spec.ts
 *
 * Unit tests for DrizzleFinanceGlRepository. `db` is mocked.
 *
 * `postDocument` was deleted (Q2, 2026-07-04) — it was dead code that wrote a
 * `[REVERSAL]`-tagged `gl_documents` header, never touching the canonical
 * `entries` ledger. The live reversal path is
 * FinanceAccountingService.reverseEntry() -> GlPostingService.postJournal(),
 * covered in test/finance/gl.service.spec.ts. In its place, this file now
 * covers getTrialBalance()/getLedger() — the two real `entries`-ledger reads
 * this repo owns that previously had no test coverage at all, and which are
 * exactly what would reflect a reversal (or fail to, per the Q2 bug report).
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  glDocuments: { id: 'id', createdAt: 'createdAt' },
  accounts: { id: 'id' },
  entries: {
    id: 'id',
    entryDate: 'entryDate',
    debitAccountId: 'debitAccountId',
    creditAccountId: 'creditAccountId',
    amount: 'amount',
  },
}));

import { DrizzleFinanceGlRepository } from '../../src/modules/finance/gl/drizzle-finance-gl.repo';

describe('DrizzleFinanceGlRepository', () => {
  let repo: DrizzleFinanceGlRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleFinanceGlRepository();
  });

  describe('findAllDocuments', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ count: '3' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.findAllDocuments(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(3);
    });

    it('returns Ok with empty data when no documents', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findAllDocuments(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findAllDocuments(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findAllAccounts', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 1, code: '1000' }]);
      const r = await repo.findAllAccounts();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty list', async () => {
      kit.queueSelect([]);
      const r = await repo.findAllAccounts();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAllAccounts();
      expect(r.ok).toBe(false);
    });
  });

  describe('findAccountById', () => {
    it('returns Ok with account when present', async () => {
      kit.queueSelect([{ id: 5, code: '5000' }]);
      const r = await repo.findAccountById(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, code: '5000' });
    });

    it('returns Ok with null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findAccountById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findAccountById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('getTrialBalance', () => {
    it('returns balanced=true when SUM(debit) equals SUM(credit)', async () => {
      kit.queueSelect([{ totalDebit: '1500.00', totalCredit: '1500.00' }]);
      const r = await repo.getTrialBalance('2026-07-01');
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.debit).toBe(1500);
        expect(r.data.credit).toBe(1500);
        expect(r.data.balanced).toBe(true);
        expect(r.data.date).toBe('2026-07-01');
      }
    });

    it('returns balanced=false when debit/credit diverge beyond tolerance', async () => {
      kit.queueSelect([{ totalDebit: '2000.00', totalCredit: '1999.00' }]);
      const r = await repo.getTrialBalance('2026-07-01');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.balanced).toBe(false);
    });

    it('defaults to today when no date is supplied', async () => {
      kit.queueSelect([{ totalDebit: '0', totalCredit: '0' }]);
      const r = await repo.getTrialBalance();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.date).toBe(new Date().toISOString().slice(0, 10));
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('trial balance down'));
      const r = await repo.getTrialBalance('2026-07-01');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('trial balance down');
    });
  });

  describe('getLedger', () => {
    it('returns Ok with rows for a given account code (both debit and credit legs)', async () => {
      kit.queueSelect([
        { id: 1, debitAccountId: '1010', creditAccountId: '9010', amount: '500' },
        { id: 2, debitAccountId: '9010', creditAccountId: '1010', amount: '500' },
      ]);
      const r = await repo.getLedger('1010');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty list when the account has no entries', async () => {
      kit.queueSelect([]);
      const r = await repo.getLedger('9999');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('ledger unavailable'));
      const r = await repo.getLedger('1010');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('ledger unavailable');
    });
  });

  describe('seedAccounts', () => {
    it('returns Ok with seeded accounts', async () => {
      kit.queueInsert([{ id: 1 }, { id: 2 }]);
      const r = await repo.seedAccounts([{ code: '1000' }, { code: '2000' }]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty when nothing inserted (conflict)', async () => {
      kit.queueInsert([]);
      const r = await repo.seedAccounts([]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('locked'));
      const r = await repo.seedAccounts([{ code: 'x' }]);
      expect(r.ok).toBe(false);
    });
  });
});
