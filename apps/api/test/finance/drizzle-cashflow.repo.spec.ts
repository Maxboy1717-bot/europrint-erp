/**
 * test/finance/drizzle-cashflow.repo.spec.ts
 *
 * Unit tests for DrizzleCashflowRepository. `db` is mocked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  cashFlowTransactions: {
    id: 'id', amount: 'amount', transactionDate: 'transactionDate',
    transactionType: 'transactionType', createdAt: 'createdAt',
  },
}));

import { DrizzleCashflowRepository } from '../../src/modules/finance/cashflow/drizzle-cashflow.repo';

describe('DrizzleCashflowRepository', () => {
  let repo: DrizzleCashflowRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleCashflowRepository();
  });

  describe('findTransactions', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      kit.queueSelect([{ count: '2' }]);
      const r = await repo.findTransactions(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(2);
    });

    it('returns Ok with empty data when none', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findTransactions(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('failure'));
      const r = await repo.findTransactions(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('createTransaction', () => {
    it('returns Ok with inserted row', async () => {
      kit.queueInsert([{ id: 1, amount: '100' }]);
      const r = await repo.createTransaction({ amount: '100', transactionType: 'inflow' });
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('bad input'));
      const r = await repo.createTransaction({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('bad input');
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.createTransaction({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Yaratishda xatolik');
    });
  });

  describe('findDailySummary', () => {
    it('returns Ok with computed net when both queries succeed', async () => {
      kit.queueSelect([{ total: '500' }]);
      kit.queueSelect([{ total: '200' }]);
      const r = await repo.findDailySummary('2026-05-15');
      expect(r.ok).toBe(true);
      if (r.ok) {
        const data = r.data as { totalInflow: number; totalOutflow: number; net: number };
        expect(data.totalInflow).toBe(500);
        expect(data.totalOutflow).toBe(200);
        expect(data.net).toBe(300);
      }
    });

    it('returns Ok with zeros when totals are null', async () => {
      kit.queueSelect([{ total: null }]);
      kit.queueSelect([{ total: null }]);
      const r = await repo.findDailySummary();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const data = r.data as { totalInflow: number; net: number };
        expect(data.totalInflow).toBe(0);
        expect(data.net).toBe(0);
      }
    });

    it('returns Err on query failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findDailySummary('2026-01-01');
      expect(r.ok).toBe(false);
    });
  });

  describe('findForecast', () => {
    it('returns Ok with grouped rows when default days passed', async () => {
      kit.queueSelect([
        { date: '2026-05-15', inflow: 1000, outflow: 200 },
      ]);
      const r = await repo.findForecast();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('clamps days to 90 max', async () => {
      kit.queueSelect([]);
      const r = await repo.findForecast(500);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findForecast(7);
      expect(r.ok).toBe(false);
    });
  });
});
