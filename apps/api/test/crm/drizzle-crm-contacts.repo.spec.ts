/**
 * test/crm/drizzle-crm-contacts.repo.spec.ts
 *
 * Unit tests for DrizzleCrmContactsRepository. `db` from `@shared/db` is
 * mocked at module level — no real DB.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  crmContacts: {
    id: 'id', deleted_at: 'deleted_at', company_id: 'company_id', created_at: 'created_at',
  },
  crmCompanies: { id: 'id' },
}));

import { DrizzleCrmContactsRepository } from '../../src/modules/crm/contacts/drizzle-crm-contacts.repo';

describe('DrizzleCrmContactsRepository', () => {
  let repo: DrizzleCrmContactsRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleCrmContactsRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count when both queries succeed', async () => {
      kit.queueSelect([{ count: '3' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.count).toBe(3);
        expect(r.data.data).toHaveLength(3);
      }
    });

    it('returns Ok with zero count when no contacts exist', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(0);
    });

    it('returns Err when select throws', async () => {
      kit.queueSelect(new Error('db down'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('db down');
    });
  });

  describe('findById', () => {
    it('returns Ok with the contact when present', async () => {
      kit.queueSelect([{ id: 5, first_name: 'Ali' }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, first_name: 'Ali' });
    });

    it('returns Ok null when contact not found', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(123);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when query throws', async () => {
      kit.queueSelect(new Error('timeout'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted contact when successful', async () => {
      kit.queueInsert([{ id: 99, first_name: 'Bobur' }]);
      const r = await repo.create({ firstName: 'Bobur' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 99, first_name: 'Bobur' });
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('duplicate'));
      const r = await repo.create({ firstName: 'X' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('duplicate');
    });

    it('maps both camelCase and snake_case dto fields', async () => {
      kit.queueInsert([{ id: 1 }]);
      const r = await repo.create({ first_name: 'Karim', last_name: 'Ali' }, 7);
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row when successful', async () => {
      kit.queueUpdate([{ id: 1, first_name: 'New' }]);
      const r = await repo.update(1, { first_name: 'New' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, first_name: 'New' });
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('not found'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('not found');
    });

    it('returns Ok with undefined when no row returned', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('returns Ok void when soft delete succeeds', async () => {
      kit.queueUpdate(undefined);
      const r = await repo.softDelete(1);
      expect(r.ok).toBe(true);
      expect(kit.db.update).toHaveBeenCalled();
    });

    it('returns Err when soft delete throws', async () => {
      kit.queueUpdate(new Error('boom'));
      const r = await repo.softDelete(2);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('boom');
    });

    it('returns Err with default message when error message empty', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.softDelete(3);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("O'chirishda xatolik");
    });
  });
});
