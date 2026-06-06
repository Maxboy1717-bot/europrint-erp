/**
 * Unit tests for CrmActivitiesRepository.
 * Covers list, today, getById, create, update, complete.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  crm_activities: {
    id: 'ca.id', type: 'ca.type', subject: 'ca.subject',
    lead_id: 'ca.lead_id', deal_id: 'ca.deal_id', assigned_to: 'ca.assigned_to',
    due_date: 'ca.due_date', notes: 'ca.notes', status: 'ca.status',
    outcome: 'ca.outcome', completed_at: 'ca.completed_at',
    created_at: 'ca.created_at', updated_at: 'ca.updated_at',
  },
  hrEmployees: { id: 'he.id', first_name: 'he.first_name', last_name: 'he.last_name' },
}));

import { CrmActivitiesRepository } from '../../src/modules/crm/application/crm-activities.repository';

describe('CrmActivitiesRepository', () => {
  let repo: CrmActivitiesRepository;
  beforeEach(() => {
    repo = new CrmActivitiesRepository();
    dbStub.__setResolved([]);
  });

  describe('list', () => {
    it('returns Ok with activities when present', async () => {
      dbStub.__setResolved([{ id: 1, type: 'call' }, { id: 2, type: 'email' }]);
      const r = await repo.list(null, null, null, undefined, undefined, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when filters yield nothing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.list(5, 10, 2, 'meeting', 'completed', 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Ok([]) when DB throws (inner catch degrades gracefully)', async () => {
      // list() has an inner try/catch that logs the error and returns [] rather
      // than re-throwing, so safeCall wraps the [] in Ok([]) instead of Err.
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.list(null, null, null, undefined, undefined, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });
  });

  describe('today', () => {
    it('returns Ok with rows when today\'s activities present', async () => {
      dbStub.__setResolved([{ id: 1, status: 'pending' }]);
      const r = await repo.today();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none for today', async () => {
      dbStub.__setResolved([]);
      const r = await repo.today();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.today();
      expect(r.ok).toBe(false);
    });
  });

  describe('getById', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1, type: 'call' }]);
      const r = await repo.getById(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, type: 'call' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 7, type: 'call', subject: 'Follow up' }]);
      const r = await repo.create('call', 'Follow up', 1, null, 2, '2025-01-01', null, 'pending');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 7, type: 'call', subject: 'Follow up' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.create('call', 'Subject', null, null, null, null, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.create('call', 'Subject', null, null, null, null, null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'in_progress' }]);
      const r = await repo.update(1, { status: 'in_progress' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'in_progress' });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.update(99, {});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.update(1, {});
      expect(r.ok).toBe(false);
    });
  });

  describe('complete', () => {
    it('returns Ok with completed row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'completed' }]);
      const r = await repo.complete(1, 'positive');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'completed' });
    });

    it('returns Ok with null when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.complete(99, 'negative');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.complete(1, 'positive');
      expect(r.ok).toBe(false);
    });
  });
});
