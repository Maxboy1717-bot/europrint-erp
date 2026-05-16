/**
 * Unit tests for CoordinationRepository.
 * Covers dokla + rasporyazhenie + stats methods.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  dokla: {
    id: 'd.id', from_user_id: 'd.from_user_id', from_name: 'd.from_name',
    council_level: 'd.council_level', subject: 'd.subject', problem: 'd.problem',
    result: 'd.result', proposal: 'd.proposal', status: 'd.status',
    created_at: 'd.created_at', updated_at: 'd.updated_at',
  },
  rasporyazhenie: {
    id: 'r.id', from_user_id: 'r.from_user_id', to_user: 'r.to_user',
    task: 'r.task', deadline: 'r.deadline', priority: 'r.priority',
    status: 'r.status', done_at: 'r.done_at', done_by: 'r.done_by',
    done_note: 'r.done_note', created_at: 'r.created_at', updated_at: 'r.updated_at',
  },
  hrEmployees: { id: 'he.id', first_name: 'he.first_name', last_name: 'he.last_name' },
  appUsers: { id: 'au.id', first_name: 'au.first_name', last_name: 'au.last_name' },
}));

import { CoordinationRepository } from '../../src/modules/director/application/coordination.repository';

describe('CoordinationRepository', () => {
  let repo: CoordinationRepository;
  beforeEach(() => {
    repo = new CoordinationRepository();
    dbStub.__setResolved([]);
  });

  describe('createDokla', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, subject: 'Issue' }]);
      const r = await repo.createDokla(1, 'level1', 'Issue', 'problem text', null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, subject: 'Issue' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createDokla(1, null, 'Issue', null, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createDokla(1, null, 'Issue', null, null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('listDokla', () => {
    it('returns Ok with rows when entries present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.listDokla();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no entries', async () => {
      dbStub.__setResolved([]);
      const r = await repo.listDokla();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listDokla();
      expect(r.ok).toBe(false);
    });
  });

  describe('getDoklaById', () => {
    it('returns Ok with rows when found', async () => {
      dbStub.__setResolved([{ id: 1, from_user_id: 5 }]);
      const r = await repo.getDoklaById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getDoklaById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getDoklaById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateDokla', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'read' }]);
      const r = await repo.updateDokla(1, 'read');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'read' });
    });

    it('returns Ok with default message when no row updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateDokla(99, 'read');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: 'Yangilandi' });
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateDokla(1, 'read');
      expect(r.ok).toBe(false);
    });
  });

  describe('createRasporyazhenie', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1 }]);
      const r = await repo.createRasporyazhenie(1, 'user2', 'task X', '2025-01-31', 'high');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1 });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createRasporyazhenie(1, null, 'task', null, 'medium');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createRasporyazhenie(1, null, 'task', null, 'medium');
      expect(r.ok).toBe(false);
    });
  });

  describe('markRaspDone', () => {
    it('returns Ok with row when mark done succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'done' }]);
      const r = await repo.markRaspDone(1, 5, 'completed');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'done' });
    });

    it('returns Ok with default message when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.markRaspDone(99, 5, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: 'Bajarildi' });
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.markRaspDone(1, 5, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('getStatsDokla', () => {
    it('returns Ok with stats when row present', async () => {
      dbStub.__setResolved([{ sent: 5, read: 3, resolved: 2, total: 10 }]);
      const r = await repo.getStatsDokla();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(10);
    });

    it('returns Ok with default zeros when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getStatsDokla();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getStatsDokla();
      expect(r.ok).toBe(false);
    });
  });

  describe('listBaskets', () => {
    it('returns Ok with empty array (stub)', async () => {
      const r = await repo.listBaskets();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Ok consistently across multiple calls', async () => {
      const r1 = await repo.listBaskets();
      const r2 = await repo.listBaskets();
      expect(r1.ok && r2.ok).toBe(true);
    });

    it('returns Ok regardless of dbStub state', async () => {
      dbStub.__setRejected(new Error('would be ignored'));
      const r = await repo.listBaskets();
      expect(r.ok).toBe(true);
    });
  });

  describe('getStatsRasp', () => {
    it('returns Ok with stats when row present', async () => {
      dbStub.__setResolved([{ assigned: 3, in_progress: 2, done: 5, overdue: 1, total: 11 }]);
      const r = await repo.getStatsRasp();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(11);
    });

    it('returns Ok with default zeros when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getStatsRasp();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getStatsRasp();
      expect(r.ok).toBe(false);
    });
  });
});
