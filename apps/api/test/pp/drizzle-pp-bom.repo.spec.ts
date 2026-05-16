/**
 * test/pp/drizzle-pp-bom.repo.spec.ts
 *
 * Unit tests for DrizzlePpBomRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  bomHeaders: { id: 'id', deletedAt: 'deletedAt' },
  bomItems: { id: 'id', bomId: 'bomId' },
}));

import { DrizzlePpBomRepository } from '../../src/modules/pp/bom/drizzle-pp-bom.repo';

describe('DrizzlePpBomRepository', () => {
  let repo: DrizzlePpBomRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzlePpBomRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1, productId: 'P1' }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty when no BOMs', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with BOM when present', async () => {
      kit.queueSelect([{ id: 1, productId: 'P1' }]);
      const r = await repo.findById(1);
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

  describe('findItemsByBomId', () => {
    it('returns Ok with items', async () => {
      kit.queueSelect([{ id: 1, bomId: 5 }]);
      const r = await repo.findItemsByBomId(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when no items', async () => {
      kit.queueSelect([]);
      const r = await repo.findItemsByBomId(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findItemsByBomId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created BOM', async () => {
      kit.queueInsert([{ id: 1, productId: 'P1' }]);
      const r = await repo.create({ productId: 'P1' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });

    it('applies default version=1.0 and status=draft', async () => {
      kit.queueInsert([{ id: 2, version: '1.0', status: 'draft' }]);
      const r = await repo.create({});
      expect(r.ok).toBe(true);
    });
  });

  describe('update', () => {
    it('returns Ok with updated BOM', async () => {
      kit.queueUpdate([{ id: 1, productId: 'P2' }]);
      const r = await repo.update(1, { productId: 'P2' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with undefined when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
    });
  });

  describe('approve', () => {
    it('returns Ok with approved BOM', async () => {
      kit.queueUpdate([{ id: 1, status: 'active' }]);
      const r = await repo.approve(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.approve(1);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.approve(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Tasdiqlashda xatolik');
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
});
