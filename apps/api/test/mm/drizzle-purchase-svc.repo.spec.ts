/**
 * test/mm/drizzle-purchase-svc.repo.spec.ts
 *
 * Unit tests for DrizzlePurchaseSvcRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  purchaseOrders: { id: 'id', createdAt: 'createdAt' },
  purchaseOrderItems: { id: 'id', purchaseOrderId: 'purchaseOrderId' },
}));

import { DrizzlePurchaseSvcRepository } from '../../src/modules/mm/purchase/drizzle-purchase-svc.repo';

describe('DrizzlePurchaseSvcRepository', () => {
  let repo: DrizzlePurchaseSvcRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzlePurchaseSvcRepository();
  });

  describe('findAll', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAll(10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok empty when no orders', async () => {
      kit.queueSelect([]);
      const r = await repo.findAll(10);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll(10);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with order when present', async () => {
      kit.queueSelect([{ id: 5 }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findItemsByOrderId', () => {
    it('returns Ok with items', async () => {
      kit.queueSelect([{ id: 1, purchaseOrderId: '5' }]);
      const r = await repo.findItemsByOrderId(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when no items', async () => {
      kit.queueSelect([]);
      const r = await repo.findItemsByOrderId(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findItemsByOrderId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created order', async () => {
      kit.queueInsert([{ id: 1, status: 'draft' }]);
      const r = await repo.create({ supplierId: 5 });
      expect(r.ok).toBe(true);
    });

    it('applies default currency=UZS when not provided', async () => {
      kit.queueInsert([{ id: 1, currency: 'UZS' }]);
      const r = await repo.create({});
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('returns Ok with updated status', async () => {
      kit.queueUpdate([{ id: 1, status: 'approved' }]);
      const r = await repo.updateStatus(1, 'approved');
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.updateStatus(1, 'approved');
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.updateStatus(1, 'approved');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Holat yangilashda xatolik');
    });
  });
});
