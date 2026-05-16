/**
 * test/finance/drizzle-sales-orders-fi.repo.spec.ts
 *
 * Unit tests for DrizzleSalesOrdersFiRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  salesOrders: { id: 'id', createdAt: 'createdAt' },
}));

import { DrizzleSalesOrdersFiRepository } from '../../src/modules/finance/sales-orders-fi/drizzle-sales-orders-fi.repo';

describe('DrizzleSalesOrdersFiRepository', () => {
  let repo: DrizzleSalesOrdersFiRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleSalesOrdersFiRepository();
  });

  describe('findAll', () => {
    it('returns Ok with paginated rows when both queries succeed', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      kit.queueSelect([{ count: '2' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(2);
    });

    it('returns Ok with empty data when no orders', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.data).toEqual([]);
        expect(r.data.count).toBe(0);
      }
    });

    it('returns Err when query throws', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('lost');
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueSelect(new Error(''));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Sotuv buyurtmalar topilmadi');
    });
  });
});
