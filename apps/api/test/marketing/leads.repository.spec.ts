/**
 * Unit tests for LeadsRepository.
 * Covers all 6 public methods: findAll / findOne / create / update / softDelete / getLossAnalysis.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  marketingLeads: {
    id: 'ml.id', deletedAt: 'ml.deleted_at', createdAt: 'ml.created_at',
    status: 'ml.status', lostReason: 'ml.lost_reason',
  },
}));

import { LeadsRepository } from '../../src/modules/marketing/leads/leads.repository';

describe('LeadsRepository', () => {
  let repo: LeadsRepository;
  beforeEach(() => {
    repo = new LeadsRepository();
    dbStub.__setResolved([]);
  });

  describe('findAll', () => {
    it('returns Ok with leads when records exist', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no leads', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('conn lost'));
      const r = await repo.findAll();
      expect(r.ok).toBe(false);
    });
  });

  describe('findOne', () => {
    it('returns Ok with row when found', async () => {
      dbStub.__setResolved([{ id: 1, status: 'new' }]);
      const r = await repo.findOne('demo-lead-1');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'new' });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findOne('missing-id');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findOne('demo-lead-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('create', () => {
    it('returns Ok with inserted row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 10 }]);
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 10 });
    });

    it('returns Ok when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert fails', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated row when match', async () => {
      dbStub.__setResolved([{ id: 1, status: 'qualified' }]);
      const r = await repo.update('demo-lead-1', { status: 'qualified' });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'qualified' });
    });

    it('returns Ok when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.update('missing-id', {});
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('conflict'));
      const r = await repo.update('demo-lead-1', {});
      expect(r.ok).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('returns Ok when update succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.softDelete('demo-lead-1');
      expect(r.ok).toBe(true);
    });

    it('returns Ok when no rows match', async () => {
      dbStub.__setResolved([]);
      const r = await repo.softDelete('missing-id');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.softDelete('demo-lead-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('getLossAnalysis', () => {
    it('returns Ok with breakdown when rows present', async () => {
      dbStub.__setResolved([
        { reason: 'price', cnt: 8 },
        { reason: 'competitor', cnt: 2 },
      ]);
      const r = await repo.getLossAnalysis();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.total).toBe(10);
        expect(r.data.breakdown).toHaveLength(2);
        expect(r.data.breakdown[0]?.percent).toBe(80);
      }
    });

    it('returns Ok with empty breakdown when no rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getLossAnalysis();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.total).toBe(0);
        expect(r.data.breakdown).toEqual([]);
      }
    });

    it('uses "other" fallback when reason is null', async () => {
      dbStub.__setResolved([{ reason: null, cnt: 3 }]);
      const r = await repo.getLossAnalysis();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.breakdown[0]?.reason).toBe('other');
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getLossAnalysis();
      expect(r.ok).toBe(false);
    });
  });
});
