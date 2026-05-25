/**
 * Unit tests for MroInventoryRepository.
 * Covers all 5 public CRUD methods.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  mroInventory: { id: 'mi.id', createdAt: 'mi.created_at' },
}));

import { MroInventoryRepository } from '../../src/modules/mro/inventory/mro-inventory.repository';

describe('MroInventoryRepository', () => {
  let repo: MroInventoryRepository;
  beforeEach(() => {
    repo = new MroInventoryRepository();
    dbStub.__setResolved([]);
  });

  describe('findAll', () => {
    it('returns Ok with data + total when query succeeds', async () => {
      dbStub.__setResolved([{ count: 5, id: 1 }, { id: 2 }]);
      const r = await repo.findAll(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(typeof r.data.total).toBe('number');
    });

    it('returns Ok with empty data when no items', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAll(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.data).toEqual([]);
        expect(r.data.total).toBe(0);
      }
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findAll(1, 10);
      expect(r.ok).toBe(false);
    });
  });

  describe('findOne', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 5, sku: 'BELT-001' }]);
      const r = await repo.findOne(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, sku: 'BELT-001' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findOne(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findOne(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 11 }]);
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 11 });
    });

    it('returns Ok with undefined when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert fails', async () => {
      dbStub.__setRejected(new Error('err'));
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.update(1, {});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Ok with undefined when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.update(99, {});
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('conflict'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });
  });

  describe('remove', () => {
    it('returns Ok when delete succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.remove(1);
      expect(r.ok).toBe(true);
    });

    it('returns Ok when target not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.remove(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on FK violation', async () => {
      dbStub.__setRejected(new Error('FK'));
      const r = await repo.remove(1);
      expect(r.ok).toBe(false);
    });
  });
});
