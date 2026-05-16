/**
 * test/hr/drizzle-hr-leave-svc.repo.spec.ts
 *
 * Unit tests for DrizzleHrLeaveSvcRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  leaveRequests: {
    id: 'id', deletedAt: 'deletedAt', userId: 'userId', status: 'status',
    leaveType: 'leaveType', createdAt: 'createdAt',
  },
  users: { id: 'id' },
}));

import { DrizzleHrLeaveSvcRepository } from '../../src/modules/hr/leave/drizzle-hr-leave-svc.repo';

describe('DrizzleHrLeaveSvcRepository', () => {
  let repo: DrizzleHrLeaveSvcRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleHrLeaveSvcRepository();
  });

  describe('findAll', () => {
    it('returns Ok with data and count', async () => {
      kit.queueSelect([{ id: 1, status: 'pending' }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.count).toBe(1);
    });

    it('returns Ok with empty when no requests', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findAll({ limit: 10, offset: 0 });
      expect(r.ok).toBe(false);
    });

    it('filters by userId when provided', async () => {
      kit.queueSelect([{ id: 1, userId: 42 }]);
      kit.queueSelect([{ count: '1' }]);
      const r = await repo.findAll({ limit: 10, offset: 0, userId: 42 });
      expect(r.ok).toBe(true);
    });
  });

  describe('findById', () => {
    it('returns Ok with leave request when present', async () => {
      kit.queueSelect([{ id: 5, status: 'pending' }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when not found', async () => {
      kit.queueSelect([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('findUserById', () => {
    it('returns Ok with user when present', async () => {
      kit.queueSelect([{ id: 42, fullName: 'Ali' }]);
      const r = await repo.findUserById(42);
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when missing', async () => {
      kit.queueSelect([]);
      const r = await repo.findUserById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findUserById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with created request', async () => {
      kit.queueInsert([{ id: 1, status: 'pending' }]);
      const r = await repo.create({ employeeId: 'emp-1', startDate: '2026-05-15', endDate: '2026-05-20' });
      expect(r.ok).toBe(true);
    });

    it('applies default status=pending', async () => {
      kit.queueInsert([{ id: 2, status: 'pending' }]);
      const r = await repo.create({});
      expect(r.ok).toBe(true);
    });

    it('returns Err on insert failure', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.create({});
      expect(r.ok).toBe(false);
    });
  });

  describe('approve', () => {
    it('returns Ok with approved status', async () => {
      kit.queueUpdate([{ id: 1, status: 'approved' }]);
      const r = await repo.approve(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.approve(1);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.approve(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Tasdiqlashda xatolik');
    });
  });

  describe('reject', () => {
    it('returns Ok with rejected status', async () => {
      kit.queueUpdate([{ id: 1, status: 'rejected' }]);
      const r = await repo.reject(1);
      expect(r.ok).toBe(true);
    });

    it('returns Err when update throws', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.reject(1);
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message', async () => {
      kit.queueUpdate(new Error(''));
      const r = await repo.reject(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Rad etishda xatolik');
    });
  });
});
