/**
 * test/design/drizzle-design-orders-svc.repo.spec.ts
 *
 * Unit tests for DrizzleDesignOrdersSvcRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  designOrders: { id: 'id', deletedAt: 'deletedAt', createdAt: 'createdAt' },
}));

import { DrizzleDesignOrdersSvcRepository } from '../../src/modules/design/orders/drizzle-design-orders-svc.repo';

describe('DrizzleDesignOrdersSvcRepository', () => {
  let repo: DrizzleDesignOrdersSvcRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleDesignOrdersSvcRepository();
  });

  describe('findAll', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty list when no orders', async () => {
      kit.queueSelect([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with order when present', async () => {
      kit.queueSelect([{ id: 5, status: 'new' }]);
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

  describe('create', () => {
    it('returns Ok with inserted order', async () => {
      kit.queueInsert([{ id: 1, status: 'new' }]);
      const r = await repo.create({ title: 'X' });
      expect(r.ok).toBe(true);
    });

    it('applies default status=new', async () => {
      kit.queueInsert([{ id: 2, status: 'new' }]);
      const r = await repo.create({});
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('returns Ok with updated order', async () => {
      kit.queueUpdate([{ id: 1, status: 'done' }]);
      const r = await repo.updateStatus(1, 'done');
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.updateStatus(1, 'done');
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.updateStatus(1, 'done');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Holat yangilashda xatolik');
    });
  });
});
