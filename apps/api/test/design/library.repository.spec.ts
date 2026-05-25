/**
 * Unit tests for LibraryRepository.
 * Covers all 5 public methods: findAll, findOne, create, update, softDelete.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  designLibraryItems: { id: 'dli.id', createdAt: 'dli.created_at', deletedAt: 'dli.deleted_at' },
}));

import { LibraryRepository } from '../../src/modules/design/library/library.repository';

describe('LibraryRepository', () => {
  let repo: LibraryRepository;
  beforeEach(() => {
    repo = new LibraryRepository();
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
      dbStub.__setResolved([{ id: 5, name: 'Logo' }]);
      const r = await repo.findOne(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, name: 'Logo' });
    });

    it('returns Ok with null when missing or soft-deleted', async () => {
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

  describe('softDelete', () => {
    it('returns Ok(null) when soft delete succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.softDelete(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Ok(null) regardless of match count', async () => {
      dbStub.__setResolved([]);
      const r = await repo.softDelete(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.softDelete(1);
      expect(r.ok).toBe(false);
    });
  });
});
