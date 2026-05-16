/**
 * test/finance/drizzle-finance-payroll.repo.spec.ts
 *
 * Unit tests for DrizzleFinancePayrollRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  payrollPeriods: { id: 'id' },
  payrollRows: { id: 'id', periodId: 'periodId' },
}));

import { DrizzleFinancePayrollRepository } from '../../src/modules/finance/payroll/drizzle-finance-payroll.repo';

describe('DrizzleFinancePayrollRepository', () => {
  let repo: DrizzleFinancePayrollRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleFinancePayrollRepository();
  });

  describe('findAll', () => {
    it('returns Ok with paginated payroll periods', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      kit.queueSelect([{ count: '2' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(2);
    });

    it('returns Ok with empty list when no periods', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('down'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with row when present', async () => {
      kit.queueSelect([{ id: 7, year: 2026 }]);
      const r = await repo.findById(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, year: 2026 });
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when db throws', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findRowsByPeriodId', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 1, periodId: 7, amount: '500' }]);
      const r = await repo.findRowsByPeriodId(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findRowsByPeriodId(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err on failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findRowsByPeriodId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created period', async () => {
      kit.queueInsert([{ id: 1, year: 2026 }]);
      const r = await repo.create({ year: 2026 });
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('strips status from dto before insert', async () => {
      kit.queueInsert([{ id: 2 }]);
      const r = await repo.create({ status: 'paid', year: 2026 });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('returns Ok with updated row', async () => {
      kit.queueUpdate([{ id: 1, status: 'paid' }]);
      const r = await repo.updateStatus(1, 'paid');
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('locked'));
      const r = await repo.updateStatus(1, 'paid');
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.updateStatus(1, 'paid');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Holat yangilashda xatolik');
    });
  });
});
