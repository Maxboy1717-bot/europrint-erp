/**
 * Unit tests for PositionsRepository.
 * Covers Ok / Err for every public CRUD method. No real DB.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  positions: { id: 'pos.id' },
  users: { id: 'users.id', positionId: 'users.pos_id' },
}));

jest.mock('@common/constants/app.constants', () => ({
  MAX_QUERY_LIMIT: 100,
}));

import { PositionsRepository } from '../../src/modules/core/positions/positions.repository';

describe('PositionsRepository', () => {
  let repo: PositionsRepository;
  beforeEach(() => {
    repo = new PositionsRepository();
    dbStub.__setResolved([]);
  });

  describe('findAll', () => {
    it('returns Ok with positions when records exist', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
    });
  });

  describe('findOne', () => {
    it('returns Ok with row when position exists', async () => {
      dbStub.__setResolved([{ id: 3, name: 'Dev' }]);
      const r = await repo.findOne(3);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 3, name: 'Dev' });
    });

    it('returns Ok with null when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findOne(999);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('fail'));
      const r = await repo.findOne(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 4, name: 'QA' }]);
      const r = await repo.create({ name: 'QA' } as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 4, name: 'QA' });
    });

    it('returns Ok with null when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.create({ name: 'Z' } as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on constraint violation', async () => {
      dbStub.__setRejected(new Error('unique'));
      const r = await repo.create({ name: 'Z' } as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, name: 'Lead' }]);
      const r = await repo.update(1, { name: 'Lead' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'Lead' });
    });

    it('returns Ok with null when no row updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.update(99, { name: 'X' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('conflict'));
      const r = await repo.update(1, { name: 'Y' });
      expect(r.ok).toBe(false);
    });
  });

  describe('countUsersForPosition', () => {
    it('returns Ok with count when rows present', async () => {
      dbStub.__setResolved([{ count: 12 }]);
      const r = await repo.countUsersForPosition(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(12);
    });

    it('returns Ok with 0 when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countUsersForPosition(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('timeout'));
      const r = await repo.countUsersForPosition(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('remove', () => {
    it('returns Ok with deleted row when match', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.remove(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Ok with null when nothing deleted', async () => {
      dbStub.__setResolved([]);
      const r = await repo.remove(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on FK violation', async () => {
      dbStub.__setRejected(new Error('FK'));
      const r = await repo.remove(1);
      expect(r.ok).toBe(false);
    });
  });
});
