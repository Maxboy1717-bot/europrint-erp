/**
 * test/director/drizzle-approval.repo.spec.ts
 *
 * Unit tests for DrizzleApprovalRepo. Read methods use mocked `db`; write
 * methods delegate to a mocked DrizzleApprovalWriteRepo.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@paralleldrive/cuid2', () => ({
  createId: jest.fn().mockReturnValue('cuid-1'),
}));

import { ApprovalStatus, HitlDocumentType } from '../../src/modules/director/domain/enums/hitl-document-type.enum';

import { DrizzleApprovalRepo } from '../../src/modules/director/infrastructure/repositories/drizzle-approval.repo';

describe('DrizzleApprovalRepo', () => {
  let repo: DrizzleApprovalRepo;
  type WriteMock = {
    save: jest.Mock; update: jest.Mock; getStats: jest.Mock;
  };
  const writeRepo: WriteMock = {
    save: jest.fn(), update: jest.fn(), getStats: jest.fn(),
  };

  const baseRow = {
    id: 'cuid-1', documentType: HitlDocumentType.PURCHASE_ORDER,
    documentId: 'doc-1', documentNumber: null, amount: '100',
    currency: 'UZS', status: ApprovalStatus.PENDING, requestedBy: 'u',
    approvedBy: null, approvedAt: null, rejectedBy: null, rejectedAt: null,
    rejectionReason: null, notes: null,
    createdAt: new Date(), updatedAt: new Date(),
  };

  beforeEach(() => {
    kit.reset();
    Object.values(writeRepo).forEach((m) => m.mockReset());
    repo = new DrizzleApprovalRepo(writeRepo as never);
  });

  describe('findById', () => {
    it('returns Ok with mapped aggregate when row present', async () => {
      kit.queueSelect([baseRow]);
      const r = await repo.findById('cuid-1');
      expect(r.ok).toBe(true);
    });

    it('returns Err NOT_FOUND when no row', async () => {
      kit.queueSelect([]);
      const r = await repo.findById('missing');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/topilmadi/);
    });

    it('returns Err when db throws', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findById('cuid-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('findPending', () => {
    it('returns Ok with items and total count', async () => {
      kit.queueSelect([baseRow, baseRow]);
      kit.queueSelect([{ count: 2 }]);
      const r = await repo.findPending({});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(2);
    });

    it('filters by documentType when provided', async () => {
      kit.queueSelect([baseRow]);
      kit.queueSelect([{ count: 1 }]);
      const r = await repo.findPending({ documentType: HitlDocumentType.PURCHASE_ORDER });
      expect(r.ok).toBe(true);
    });

    it('returns Err when db query fails', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findPending({});
      expect(r.ok).toBe(false);
    });
  });

  describe('findHistory', () => {
    it('returns Ok with items and total', async () => {
      kit.queueSelect([baseRow]);
      kit.queueSelect([{ count: 1 }]);
      const r = await repo.findHistory({});
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.total).toBe(1);
    });

    it('filters by status when provided', async () => {
      kit.queueSelect([baseRow]);
      kit.queueSelect([{ count: 1 }]);
      const r = await repo.findHistory({ status: ApprovalStatus.APPROVED });
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findHistory({});
      expect(r.ok).toBe(false);
    });
  });

  describe('findExistingPending', () => {
    it('returns Ok with aggregate when match present', async () => {
      kit.queueSelect([baseRow]);
      const r = await repo.findExistingPending(HitlDocumentType.PURCHASE_ORDER, 'doc-1');
      expect(r.ok).toBe(true);
    });

    it('returns Ok null when no match', async () => {
      kit.queueSelect([]);
      const r = await repo.findExistingPending(HitlDocumentType.PURCHASE_ORDER, 'doc-x');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findExistingPending(HitlDocumentType.PURCHASE_ORDER, 'doc-1');
      expect(r.ok).toBe(false);
    });
  });

  describe('write delegates', () => {
    it('delegates save to writeRepo', async () => {
      writeRepo.save.mockResolvedValueOnce({ ok: true, data: {} });
      const r = await repo.save({ documentId: 'doc-1' });
      expect(writeRepo.save).toHaveBeenCalledTimes(1);
      expect(r.ok).toBe(true);
    });

    it('delegates update to writeRepo with id and data', async () => {
      writeRepo.update.mockResolvedValueOnce({ ok: true, data: {} });
      const r = await repo.update('cuid-1', { status: ApprovalStatus.APPROVED });
      expect(writeRepo.update).toHaveBeenCalledWith('cuid-1', { status: ApprovalStatus.APPROVED });
      expect(r.ok).toBe(true);
    });

    it('delegates getStats to writeRepo', async () => {
      writeRepo.getStats.mockResolvedValueOnce({ ok: true, data: { pending: 1, approvedToday: 0, rejectedToday: 0, avgApprovalTimeHours: 0 } });
      const r = await repo.getStats();
      expect(writeRepo.getStats).toHaveBeenCalledTimes(1);
      expect(r.ok).toBe(true);
    });
  });
});
