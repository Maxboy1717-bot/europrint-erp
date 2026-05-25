/**
 * Unit tests for AlertsRepository.
 * Covers findAll (paginated), findOne, create, update, remove.
 * Note: findAll uses Promise.all over the same chainable stub, so we set
 * the resolved value to a tuple-compatible shape on the chain.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  notifications: { id: 'n.id', createdAt: 'n.created_at' },
}));

import { AlertsRepository } from '../../src/modules/notifications/alerts/alerts.repository';

describe('AlertsRepository', () => {
  let repo: AlertsRepository;
  beforeEach(() => {
    repo = new AlertsRepository();
    dbStub.__setResolved([]);
  });

  describe('findAll', () => {
    it('returns Ok with data + total when both queries succeed', async () => {
      // Both parallel queries resolve with the same stub; the count query
      // shape is [{ count: N }] and the data query is the list of rows.
      // Because we cannot distinguish them inside the chain, we resolve to
      // an array that satisfies both shapes for the test boundary.
      dbStub.__setResolved([{ count: 5, id: 1 }, { id: 2 }]);
      const r = await repo.findAll(1, 10);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(Array.isArray(r.data.data)).toBe(true);
        expect(typeof r.data.total).toBe('number');
      }
    });

    it('returns Ok with empty data when no notifications', async () => {
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
      dbStub.__setResolved([{ id: 5, title: 'Alert' }]);
      const r = await repo.findOne(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, title: 'Alert' });
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
    it('returns Ok with inserted row when insert succeeds', async () => {
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
    it('returns Ok with updated row when match', async () => {
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
