/**
 * Unit tests for ApprovalsRepository.
 * Covers Ok / Err for every public method. No real DB.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('@europrint/schemas', () => ({
  approvalRequests: {
    id: 'ar.id',
    documentType: 'ar.document_type',
    documentId: 'ar.document_id',
    status: 'ar.status',
    approvedBy: 'ar.approved_by',
    approvedAt: 'ar.approved_at',
    notes: 'ar.notes',
  },
}));

import { ApprovalsRepository } from '../../src/modules/director/approvals/approvals.repository';

describe('ApprovalsRepository', () => {
  let repo: ApprovalsRepository;
  beforeEach(() => {
    repo = new ApprovalsRepository();
    dbStub.__setResolved([]);
  });

  describe('findExistingPending', () => {
    it('returns Ok with pending row when one exists', async () => {
      dbStub.__setResolved([{ id: 1, status: 'pending' }]);
      const r = await repo.findExistingPending('PO', '42');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'pending' });
    });

    it('returns Ok with null when no pending row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findExistingPending('PO', '99');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findExistingPending('PO', '42');
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

    it('returns Ok with undefined row when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      dbStub.__setRejected(new Error('insert error'));
      const r = await repo.create({} as unknown as Parameters<typeof repo.create>[0]);
      expect(r.ok).toBe(false);
    });
  });

  describe('findById', () => {
    it('returns Ok with row when match', async () => {
      dbStub.__setResolved([{ id: 5 }]);
      const r = await repo.findById(5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5 });
    });

    it('returns Ok with null when missing', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findById(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findById(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('approve', () => {
    it('returns Ok with approved row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 5, status: 'approved' }]);
      const r = await repo.approve(5, 'user-1', 'looks good');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, status: 'approved' });
    });

    it('returns Ok with undefined when no row updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.approve(99, 'user-1');
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('locked'));
      const r = await repo.approve(5, 'user-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('reject', () => {
    it('returns Ok with rejected row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 5, status: 'rejected' }]);
      const r = await repo.reject(5, 'bad');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, status: 'rejected' });
    });

    it('returns Ok with undefined when no row updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.reject(99);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('conflict'));
      const r = await repo.reject(5);
      expect(r.ok).toBe(false);
    });
  });
});
