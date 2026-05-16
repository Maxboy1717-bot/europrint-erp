/**
 * Unit tests for DepartmentsRepository.
 * Covers Ok / Err path for each public CRUD method. No real DB.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  departments: { id: 'dept.id' },
  users: { id: 'users.id', departmentId: 'users.dept_id', positionId: 'users.pos_id', deletedAt: 'users.deleted_at', fullName: 'users.full_name' },
}));

import { DepartmentsRepository } from '../../src/modules/core/departments/departments.repository';

describe('DepartmentsRepository', () => {
  let repo: DepartmentsRepository;
  beforeEach(() => {
    repo = new DepartmentsRepository();
    dbStub.__setResolved([]);
  });

  describe('findAll', () => {
    it('returns Ok with departments when records exist', async () => {
      dbStub.__setResolved([{ id: 1, name: 'HR' }, { id: 2, name: 'Eng' }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no records', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('connection refused'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
    });
  });

  describe('findOne', () => {
    it('returns Ok with row when department exists', async () => {
      dbStub.__setResolved([{ id: 1, name: 'HR' }]);
      const r = await repo.findOne(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'HR' });
    });

    it('returns Ok with null when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findOne(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('bad query'));
      const r = await repo.findOne(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 5, name: 'New' }]);
      const r = await repo.create({ name: 'New' } as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, name: 'New' });
    });

    it('returns Ok with null when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.create({ name: 'X' } as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on duplicate constraint', async () => {
      dbStub.__setRejected(new Error('unique violation'));
      const r = await repo.create({ name: 'D' } as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, name: 'HR2' }]);
      const r = await repo.update(1, { name: 'HR2' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'HR2' });
    });

    it('returns Ok with null when no row updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.update(99, { name: 'X' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('deadlock'));
      const r = await repo.update(1, { name: 'Y' });
      expect(r.ok).toBe(false);
    });
  });

  describe('countUsersForDepartment', () => {
    it('returns Ok with numeric count when rows present', async () => {
      dbStub.__setResolved([{ count: 7 }]);
      const r = await repo.countUsersForDepartment(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(7);
    });

    it('returns Ok with 0 when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.countUsersForDepartment(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('timeout'));
      const r = await repo.countUsersForDepartment(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('remove', () => {
    it('returns Ok with deleted row when match found', async () => {
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
      dbStub.__setRejected(new Error('FK constraint'));
      const r = await repo.remove(1);
      expect(r.ok).toBe(false);
    });
  });
});
