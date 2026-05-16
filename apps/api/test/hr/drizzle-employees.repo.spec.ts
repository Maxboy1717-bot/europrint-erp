/**
 * test/hr/drizzle-employees.repo.spec.ts
 *
 * Unit tests for DrizzleEmployeesRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  users: {
    id: 'id', deletedAt: 'deletedAt', fullName: 'fullName',
    departmentId: 'departmentId', status: 'status', createdAt: 'createdAt',
  },
}));

import { DrizzleEmployeesRepository } from '../../src/modules/hr/employees/drizzle-employees.repo';

describe('DrizzleEmployeesRepository', () => {
  let repo: DrizzleEmployeesRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleEmployeesRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ count: '2' }]);
      kit.queueSelect([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(2);
    });

    it('returns Ok with empty when no employees', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(false);
    });

    it('filters by search term when provided', async () => {
      kit.queueSelect([{ count: '1' }]);
      kit.queueSelect([{ id: 1 }]);
      const r = await repo.findAll({ limit: 10, offset: 0, search: 'Ali' });
      expect(r.ok).toBe(true);
    });
  });

  describe('findById', () => {
    it('returns Ok with employee when present', async () => {
      kit.queueSelect([{ id: 7, fullName: 'Ali Valiev' }]);
      const r = await repo.findById(7);
      expect(r.ok).toBe(true);
      if (r.ok) expect((r.data as { id: number }).id).toBe(7);
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

  describe('findByDepartment', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ count: '1' }]);
      kit.queueSelect([{ id: 1, departmentId: 5 }]);
      const r = await repo.findByDepartment(5, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty when no rows', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findByDepartment(5, 10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findByDepartment(5, 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('findSelf', () => {
    it('returns Ok with current user data', async () => {
      kit.queueSelect([{ count: '1' }]);
      kit.queueSelect([{ id: 42, fullName: 'Me' }]);
      const r = await repo.findSelf(42, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty when self not found', async () => {
      kit.queueSelect([{ count: '0' }]);
      kit.queueSelect([]);
      const r = await repo.findSelf(99, 10, 0);
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findSelf(1, 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created employee', async () => {
      kit.queueInsert([{ id: 10, fullName: 'New' }]);
      const r = await repo.create({ fullName: 'New' });
      expect(r.ok).toBe(true);
    });

    it('applies default status=active', async () => {
      kit.queueInsert([{ id: 11, status: 'active' }]);
      const r = await repo.create({ fullName: 'A' });
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row', async () => {
      kit.queueUpdate([{ id: 1, fullName: 'Edited' }]);
      const r = await repo.update(1, { fullName: 'Edited' });
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
      if (r.ok) expect(r.data).toBeUndefined();
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
