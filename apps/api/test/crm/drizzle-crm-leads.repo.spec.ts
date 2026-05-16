/**
 * test/crm/drizzle-crm-leads.repo.spec.ts
 *
 * Unit tests for DrizzleCrmLeadsRepository. `db` is mocked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  crmLeads: { id: 'id', deleted_at: 'deleted_at', created_at: 'created_at' },
}));

import { DrizzleCrmLeadsRepository } from '../../src/modules/crm/leads/drizzle-crm-leads.repo';

describe('DrizzleCrmLeadsRepository', () => {
  let repo: DrizzleCrmLeadsRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleCrmLeadsRepository();
  });

  describe('findAll', () => {
    it('returns Ok with mapped leads when query succeeds', async () => {
      kit.queueSelect([{ count: '2' }]);
      kit.queueSelect([
        { id: 1, contact_name: 'Ali', status: 'new', created_at: '2026-01-01' },
        { id: 2, contact_name: 'Bobur', status: 'qualified', created_at: '2026-01-02' },
      ]);
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.count).toBe(2);
        expect(r.data.data).toHaveLength(2);
        expect(r.data.data[0]).toMatchObject({ id: 1, title: 'Ali' });
      }
    });

    it('returns Ok with empty list when no leads', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findAll(20, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(0);
    });

    it('returns Err when db query rejects', async () => {
      kit.queueSelect(new Error('conn refused'));
      const r = await repo.findAll(10, 0);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('conn refused');
    });
  });

  describe('findById', () => {
    it('returns Ok with mapped lead when present', async () => {
      kit.queueSelect([{ id: 5, contact_name: 'Sara', status: 'new' }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
      if (r.ok && r.data) expect((r.data as { id: number }).id).toBe(5);
    });

    it('returns Ok with null when lead missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with mapped lead when insert succeeds', async () => {
      kit.queueInsert([{ id: 10, contact_name: 'Davlat', status: 'new' }]);
      const r = await repo.create({ firstName: 'Davlat', email: 'a@b.uz' });
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { id: number }).id).toBe(10);
      expect(kit.db.insert).toHaveBeenCalled();
    });

    it('returns Err when insert fails', async () => {
      kit.queueInsert(new Error('duplicate'));
      const r = await repo.create({ firstName: 'X' });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('duplicate');
    });

    it('uses createdBy as manager_id when assignedTo missing', async () => {
      kit.queueInsert([{ id: 11 }]);
      const r = await repo.create({ firstName: 'A' }, 42);
      expect(r.ok).toBe(true);
      expect(kit.db.insert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('returns Ok with mapped row when update succeeds', async () => {
      kit.queueUpdate([{ id: 1, contact_name: 'Updated', status: 'qualified' }]);
      const r = await repo.update(1, { status: 'qualified' });
      expect(r.ok).toBe(true);
    });

    it('returns Err when update rejects', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });

    it('returns Ok with empty object when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.update(404, {});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
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
      kit.queueUpdate(new Error('locked'));
      const r = await repo.softDelete(2);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('locked');
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.softDelete(3);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("O'chirishda xatolik");
    });
  });
});
