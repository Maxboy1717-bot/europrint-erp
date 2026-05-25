/**
 * test/hr/drizzle-hr-payroll.repo.spec.ts
 *
 * Unit tests for DrizzleHrPayrollRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  salaryHistory: {
    id: 'id', userId: 'userId', changeType: 'changeType',
    effectiveDate: 'effectiveDate', createdAt: 'createdAt',
  },
}));

import { DrizzleHrPayrollRepository } from '../../src/modules/hr/payroll/drizzle-hr-payroll.repo';

describe('DrizzleHrPayrollRepository', () => {
  let repo: DrizzleHrPayrollRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleHrPayrollRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count when no filter applied', async () => {
      kit.queueSelect([{ id: 1, amount: '500000' }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with filtered data when userId provided', async () => {
      kit.queueSelect([{ id: 1, userId: 42 }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll({ limit: 10, offset: 0, userId: 42 });
      expect(r.ok).toBe(true);
    });

    it('returns Ok with empty when no rows', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted history row', async () => {
      kit.queueInsert([{ id: 1, userId: 7, amount: '500' }]);
      const r = await repo.create({ userId: 7, amount: '500' });
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when error empty', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Yaratishda xatolik');
    });
  });
});
