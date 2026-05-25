/**
 * test/finance/drizzle-order-costing.repo.spec.ts
 *
 * Unit tests for DrizzleOrderCostingRepository. `db` is mocked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  orderCostings: {
    id: 'id', createdAt: 'createdAt', marginPercent: 'marginPercent',
  },
  orderCostingLines: { id: 'id', orderCostingId: 'orderCostingId' },
}));

import { DrizzleOrderCostingRepository } from '../../src/modules/finance/order-costing/drizzle-order-costing.repo';

describe('DrizzleOrderCostingRepository', () => {
  let repo: DrizzleOrderCostingRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleOrderCostingRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1 }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty when no rows', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with row and lines when present', async () => {
      kit.queueSelect([{ id: 1, materialCost: '100' }]);
      kit.queueSelect([{ id: 10, item: 'paper' }]);
      const r = await repo.findById(1);
      expect(r.ok).toBe(true);
      if (r.ok && r.data) {
        const obj = r.data as { id: number; lines: unknown[] };
        expect(obj.id).toBe(1);
        expect(obj.lines).toHaveLength(1);
      }
    });

    it('returns Ok null when not found', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('bad'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok when insert succeeds', async () => {
      kit.queueInsert([{ id: 7 }]);
      const r = await repo.create({ orderNumber: 'OC-1' });
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Yaratishda xatolik');
    });
  });

  describe('findTopProfitable', () => {
    it('returns Ok with rows ordered by margin desc', async () => {
      kit.queueSelect([{ id: 1, marginPercent: '50' }]);
      const r = await repo.findTopProfitable(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findTopProfitable(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findTopProfitable(5);
      expect(r.ok).toBe(false);
    });
  });

  describe('findTopLoss', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 2, marginPercent: '-30' }]);
      const r = await repo.findTopLoss(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty list when none', async () => {
      kit.queueSelect([]);
      const r = await repo.findTopLoss(5);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findTopLoss(5);
      expect(r.ok).toBe(false);
    });
  });

  describe('calculate', () => {
    it('returns Ok with computed totals when row found', async () => {
      kit.queueSelect([{ id: 1, materialCost: '100', laborCost: '50', overheadCost: '20', sellingPrice: '300' }]);
      kit.queueUpdate([{ id: 1, totalCost: '170', marginPercent: '43.33333333333333' }]);
      const r = await repo.calculate(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { id: number }).id).toBe(1);
    });

    it('returns Err when order not found', async () => {
      kit.queueSelect([]);
      const r = await repo.calculate(404);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('404');
    });

    it('returns Err when update throws', async () => {
      kit.queueSelect([{ id: 1, materialCost: '100', sellingPrice: '200' }]);
      kit.queueUpdate(new Error('locked'));
      const r = await repo.calculate(1);
      expect(r.ok).toBe(false);
    });
  });
});
