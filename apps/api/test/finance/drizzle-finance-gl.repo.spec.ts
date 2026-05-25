/**
 * test/finance/drizzle-finance-gl.repo.spec.ts
 *
 * Unit tests for DrizzleFinanceGlRepository. `db` is mocked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  glDocuments: { id: 'id', createdAt: 'createdAt' },
  accounts: { id: 'id' },
}));

import { DrizzleFinanceGlRepository } from '../../src/modules/finance/gl/drizzle-finance-gl.repo';

describe('DrizzleFinanceGlRepository', () => {
  let repo: DrizzleFinanceGlRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleFinanceGlRepository();
  });

  describe('findAllDocuments', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ count: '3' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.findAllDocuments(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(3);
    });

    it('returns Ok with empty data when no documents', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findAllDocuments(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findAllDocuments(10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findAllAccounts', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ id: 1, code: '1000' }]);
      const r = await repo.findAllAccounts();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty list', async () => {
      kit.queueSelect([]);
      const r = await repo.findAllAccounts();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAllAccounts();
      expect(r.ok).toBe(false);
    });
  });

  describe('findAccountById', () => {
    it('returns Ok with account when present', async () => {
      kit.queueSelect([{ id: 5, code: '5000' }]);
      const r = await repo.findAccountById(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, code: '5000' });
    });

    it('returns Ok with null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findAccountById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findAccountById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('postDocument', () => {
    it('returns Ok with posted doc', async () => {
      kit.queueInsert([{ id: 1, status: 'posted' }]);
      const r = await repo.postDocument({ description: 'test' });
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('bad data'));
      const r = await repo.postDocument({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('bad data');
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.postDocument({});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Hujjat joylashtirishda xatolik');
    });
  });

  describe('seedAccounts', () => {
    it('returns Ok with seeded accounts', async () => {
      kit.queueInsert([{ id: 1 }, { id: 2 }]);
      const r = await repo.seedAccounts([{ code: '1000' }, { code: '2000' }]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty when nothing inserted (conflict)', async () => {
      kit.queueInsert([]);
      const r = await repo.seedAccounts([]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('locked'));
      const r = await repo.seedAccounts([{ code: 'x' }]);
      expect(r.ok).toBe(false);
    });
  });
});
