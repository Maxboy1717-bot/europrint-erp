/** test/finance/drizzle-fi.repo.spec.ts — tests for DrizzleFiRepository */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
  payments: { id: 'id', created_at: 'created_at' },
  income_expense_transactions: {
    id: 'id', amount: 'amount', transaction_type: 'transaction_type',
    status: 'status', created_at: 'created_at',
  },
  profit_centers: { id: 'id', created_at: 'created_at' },
  cost_centers: { id: 'id', created_at: 'created_at' },
}));

jest.mock('@europrint/schemas', () => ({
  accountingPeriods: { id: 'id', createdAt: 'createdAt' },
  glDocuments: { id: 'id', createdAt: 'createdAt' },
}));

import { DrizzleFiRepository } from '../../src/modules/finance/fi/drizzle-fi.repo';

describe('DrizzleFiRepository', () => {
  let repo: DrizzleFiRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleFiRepository();
  });

  describe('findAccountingPeriods', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1 }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAccountingPeriods(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty list', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAccountingPeriods(10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAccountingPeriods(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('createAccountingPeriod', () => {
    it('returns Ok with created period', async () => {
      kit.queueInsert([{ id: 1 }]);
      const r = await repo.createAccountingPeriod({ year: 2026 });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.createAccountingPeriod({});
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.createAccountingPeriod({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Yaratishda xatolik');
    });
  });

  describe('closeAccountingPeriod', () => {
    it('returns Ok with closed period', async () => {
      kit.queueUpdate([{ id: 1, status: 'closed' }]);
      const r = await repo.closeAccountingPeriod(1);
      expect(r.ok).toBe(true);
    });

    it('returns Ok with null when no row', async () => {
      kit.queueUpdate([]);
      const r = await repo.closeAccountingPeriod(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.closeAccountingPeriod(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('postGlDocument', () => {
    it('returns Ok with posted doc', async () => {
      kit.queueUpdate([{ id: 1, status: 'posted' }]);
      const r = await repo.postGlDocument(1);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when not found', async () => {
      kit.queueUpdate([]);
      const r = await repo.postGlDocument(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('x'));
      const r = await repo.postGlDocument(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findPayments', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1 }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findPayments(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok empty when no payments', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findPayments(10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findPayments(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('createPayment', () => {
    it('returns Ok with created payment', async () => {
      kit.queueInsert([{ id: 1, amount: '500' }]);
      const r = await repo.createPayment({ amount: '500' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('bad'));
      const r = await repo.createPayment({});
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.createPayment({});
      expect(r.ok).toBe(false);
    });
  });

  describe('getCostCenters', () => {
    it('returns Ok with rows from DB', async () => {
      kit.queueSelect([{ id: 1, name: 'Sales' }]);
      const r = await repo.getCostCenters();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with defaults when DB returns empty', async () => {
      kit.queueSelect([]);
      const r = await repo.getCostCenters();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.length).toBeGreaterThan(0);
    });

    it('returns Ok with defaults when DB errors', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getCostCenters();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.length).toBeGreaterThan(0);
    });
  });

  describe('createCostCenter', () => {
    it('returns Ok with created cost center', async () => {
      kit.queueInsert([{ id: 1, name: 'CC1' }]);
      const r = await repo.createCostCenter({ name: 'CC1' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.createCostCenter({});
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when error empty', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.createCostCenter({});
      expect(r.ok).toBe(false);
    });
  });

  describe('updateCostCenter', () => {
    it('returns Ok with updated cost center', async () => {
      kit.queueUpdate([{ id: 1, name: 'New' }]);
      const r = await repo.updateCostCenter(1, { name: 'New' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lost'));
      const r = await repo.updateCostCenter(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with empty when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.updateCostCenter(404, {});
      expect(r.ok).toBe(true);
    });
  });

  describe('deleteCostCenter', () => {
    it('returns Ok void when delete succeeds', async () => {
      kit.queueDelete(undefined);
      const r = await repo.deleteCostCenter(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when delete throws', async () => {
      kit.queueDelete(new Error('FK'));
      const r = await repo.deleteCostCenter(2);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueDelete(new Error(''));
      const r = await repo.deleteCostCenter(3);
      expect(r.ok).toBe(false);
    });
  });

  describe('getStats', () => {
    it('returns Ok with computed totals', async () => {
      kit.queueSelect([{ total: '1000' }]);
      kit.queueSelect([{ total: '300' }]);
      kit.queueSelect([{ cnt: '2', amt: '500' }]);
      const r = await repo.getStats();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.revenue).toBe(1000);
        expect(r.data.expenses).toBe(300);
        expect(r.data.unpaidInvoices).toBe(2);
      }
    });

    it('returns Ok with zeros when totals null', async () => {
      kit.queueSelect([{ total: null }]);
      kit.queueSelect([{ total: null }]);
      kit.queueSelect([{ cnt: '0', amt: '0' }]);
      const r = await repo.getStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.revenue).toBe(0);
    });

    it('returns Err when any query throws', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getStats();
      expect(r.ok).toBe(false);
    });
  });

  describe('getRecentTransactions', () => {
    it('returns Ok with recent transactions', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.getRecentTransactions(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.getRecentTransactions(5);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.getRecentTransactions(5);
      expect(r.ok).toBe(false);
    });
  });
});
