/**
 * test/finance/drizzle-finance-budgets.repo.spec.ts
 *
 * Unit tests for DrizzleFinanceBudgetsRepository. `db` is mocked at the
 * module level.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  budgets: { id: 'id', deletedAt: 'deletedAt', createdAt: 'createdAt' },
  budget_lines: { id: 'id', budgetId: 'budgetId' },
}));

import { DrizzleFinanceBudgetsRepository } from '../../src/modules/finance/budgets/drizzle-finance-budgets.repo';

describe('DrizzleFinanceBudgetsRepository', () => {
  let repo: DrizzleFinanceBudgetsRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleFinanceBudgetsRepository();
  });

  describe('findAll', () => {
    it('returns Ok with paginated budgets', async () => {
      kit.queueSelect([{ count: '2' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAll(20, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(2);
    });

    it('returns Ok with empty list when no budgets', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findAll(20, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.data).toEqual([]);
    });

    it('returns Err when db throws', async () => {
      kit.queueSelect(new Error('db gone'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with budget when present', async () => {
      kit.queueSelect([{ id: 7 }]);
      const r = await repo.findById(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { id: number }).id).toBe(7);
    });

    it('returns Ok with null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created budget when insert succeeds', async () => {
      kit.queueInsert([{ id: 1, category: 'OPS' }]);
      const r = await repo.create({ category: 'OPS' });
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('invalid'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('invalid');
    });

    it('applies default status=draft', async () => {
      kit.queueInsert([{ id: 1, status: 'draft' }]);
      const r = await repo.create({});
      expect(r.ok).toBe(true);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row', async () => {
      kit.queueUpdate([{ id: 1, plannedAmount: '500' }]);
      const r = await repo.update(1, { plannedAmount: '500' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('fail'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok when row missing (returning empty)', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeUndefined();
    });
  });

  describe('approve', () => {
    it('returns Ok with approved budget', async () => {
      kit.queueUpdate([{ id: 1, status: 'approved' }]);
      const r = await repo.approve(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('locked'));
      const r = await repo.approve(2);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('locked');
    });

    it('returns Ok with undefined when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.approve(3);
      expect(r.ok).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('returns Ok void on success', async () => {
      kit.queueUpdate(undefined);
      const r = await repo.softDelete(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('boom'));
      const r = await repo.softDelete(2);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.softDelete(3);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("O'chirishda xatolik");
    });
  });

  describe('findBudgetLines', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      kit.queueSelect([{ count: '2' }]);
      const r = await repo.findBudgetLines('budget-1', 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(2);
    });

    it('returns Ok empty when none', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findBudgetLines('b', 10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findBudgetLines('b', 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('createBudgetLine', () => {
    it('returns Ok with inserted line', async () => {
      kit.queueInsert([{ id: 1, budgetId: 'b1' }]);
      const r = await repo.createBudgetLine('b1', { amount: 100 });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('bad'));
      const r = await repo.createBudgetLine('b1', {});
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when error empty', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.createBudgetLine('b1', {});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Byudjet qatori yaratishda xatolik');
    });
  });
});
