/**
 * test/director/drizzle-approval-write.repo.spec.ts
 *
 * Unit tests for DrizzleApprovalWriteRepo. The approvalRequestsTable Drizzle
 * schema is defined inside the repo file itself; `db` is mocked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

const approvalTableStub = {
  id: 'ar.id', documentType: 'ar.documentType', documentId: 'ar.documentId',
  documentNumber: 'ar.documentNumber', amount: 'ar.amount', currency: 'ar.currency',
  status: 'ar.status', requestedBy: 'ar.requestedBy', approvedBy: 'ar.approvedBy',
  approvedAt: 'ar.approvedAt', rejectedBy: 'ar.rejectedBy', rejectedAt: 'ar.rejectedAt',
  rejectionReason: 'ar.rejectionReason', notes: 'ar.notes',
  createdAt: 'ar.createdAt', updatedAt: 'ar.updatedAt',
};

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
  approval_requests: approvalTableStub,
}));

jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn().mockReturnValue('cuid-123'),
}));

import { ApprovalStatus, HitlDocumentType } from '../../src/modules/director/domain/enums/hitl-document-type.enum';

import { DrizzleApprovalWriteRepo } from '../../src/modules/director/infrastructure/repositories/drizzle-approval-write.repo';

describe('DrizzleApprovalWriteRepo', () => {
  let repo: DrizzleApprovalWriteRepo;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleApprovalWriteRepo();
  });

  describe('save', () => {
    it('returns Ok with mapped row when insert succeeds', async () => {
      kit.queueInsert([{
        id: 'cuid-123', documentType: HitlDocumentType.PURCHASE_ORDER,
        documentId: 'doc-1', documentNumber: 'PO-001',
        amount: '5000', currency: 'UZS', status: ApprovalStatus.PENDING,
        requestedBy: 'user-1', approvedBy: null, approvedAt: null,
        rejectedBy: null, rejectedAt: null, rejectionReason: null,
        notes: null, createdAt: new Date(), updatedAt: new Date(),
      }]);
      const r = await repo.save({
        documentType: HitlDocumentType.PURCHASE_ORDER,
        documentId: 'doc-1', amount: 5000, requestedBy: 'user-1',
      });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert returns empty array', async () => {
      kit.queueInsert([]);
      const r = await repo.save({
        documentType: HitlDocumentType.PURCHASE_ORDER,
        documentId: 'doc-1', amount: 100, requestedBy: 'u',
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/saqlash/);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('lock'));
      const r = await repo.save({
        documentType: HitlDocumentType.PURCHASE_ORDER,
        documentId: 'doc-1', amount: 100, requestedBy: 'u',
      });
      expect(r.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('returns Ok with updated approval', async () => {
      kit.queueUpdate([{
        id: 'cuid-123', documentType: HitlDocumentType.PURCHASE_ORDER,
        documentId: 'doc-1', documentNumber: null, amount: '5000',
        currency: 'UZS', status: ApprovalStatus.APPROVED,
        requestedBy: 'u', approvedBy: 'admin', approvedAt: new Date(),
        rejectedBy: null, rejectedAt: null, rejectionReason: null,
        notes: null, createdAt: new Date(), updatedAt: new Date(),
      }]);
      const r = await repo.update('cuid-123', {
        status: ApprovalStatus.APPROVED, approvedBy: 'admin', approvedAt: new Date(),
      });
      expect(r.ok).toBe(true);
    });

    it('returns Err when no row matched', async () => {
      kit.queueUpdate([]);
      const r = await repo.update('missing', { status: ApprovalStatus.APPROVED });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/yangilan/);
    });

    it('returns Err when update rejects', async () => {
      kit.queueUpdate(new Error('lock'));
      const r = await repo.update('cuid-123', {});
      expect(r.ok).toBe(false);
    });
  });

  describe('getStats', () => {
    it('returns Ok with computed stats', async () => {
      kit.queueSelect([{ count: 3 }]);
      kit.queueSelect([{ count: 5 }]);
      kit.queueSelect([{ count: 1 }]);
      kit.queueSelect([{ avg_hours: '2.5' }]);
      const r = await repo.getStats();
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.pending).toBe(3);
        expect(r.data.approvedToday).toBe(5);
        expect(r.data.rejectedToday).toBe(1);
        expect(r.data.avgApprovalTimeHours).toBeCloseTo(2.5);
      }
    });

    it('returns Ok with zeros when no data', async () => {
      kit.queueSelect([{ count: 0 }]);
      kit.queueSelect([{ count: 0 }]);
      kit.queueSelect([{ count: 0 }]);
      kit.queueSelect([{ avg_hours: '0' }]);
      const r = await repo.getStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.pending).toBe(0);
    });

    it('returns Err when any query fails', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.getStats();
      expect(r.ok).toBe(false);
    });
  });
});
