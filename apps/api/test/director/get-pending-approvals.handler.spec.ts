/**
 * test/director/get-pending-approvals.handler.spec.ts
 *
 * Unit tests for GetPendingApprovalsHandler. IApprovalRepo is mocked; the
 * handler is a thin pass-through that forwards filters to findPending.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetPendingApprovalsHandler } from '../../src/modules/director/application/queries/get-pending-approvals.handler';
import { GetPendingApprovalsQuery } from '../../src/modules/director/application/queries/get-pending-approvals.query';
import { ApprovalRequest } from '../../src/modules/director/domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO } from '../../src/modules/director/domain/repositories/i-approval.repo';
import { HitlDocumentType, ApprovalStatus } from '../../src/modules/director/domain/enums/hitl-document-type.enum';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  findPending: jest.Mock;
  findById: jest.Mock; findHistory: jest.Mock; findExistingPending: jest.Mock; save: jest.Mock; update: jest.Mock; getStats: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findPending: jest.fn(),
    findById: jest.fn(), findHistory: jest.fn(), findExistingPending: jest.fn(),
    save: jest.fn(), update: jest.fn(), getStats: jest.fn(),
  };
}

function makeRequest(): ApprovalRequest {
  return new ApprovalRequest(
    'r-1', HitlDocumentType.PURCHASE_ORDER, 'doc-1', 'PO-1', 60_000_000, 'UZS',
    ApprovalStatus.PENDING, 'user-7', null, null, null, null, null, null,
    new Date('2026-01-01'), new Date('2026-01-01'),
  );
}

describe('GetPendingApprovalsHandler', () => {
  let handler: GetPendingApprovalsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPendingApprovalsHandler,
        { provide: APPROVAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(GetPendingApprovalsHandler);
  });

  it('returns the Err result verbatim when repo fails', async () => {
    repo.findPending.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(new GetPendingApprovalsQuery());

    expect(r.ok).toBe(false);
  });

  it('returns Ok with items + total when repo succeeds', async () => {
    repo.findPending.mockResolvedValue(Ok({ items: [makeRequest()], total: 1 }));

    const r = await handler.execute(new GetPendingApprovalsQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(1);
      expect(r.data.total).toBe(1);
    }
  });

  it('forwards documentType / page / limit filters to the repo', async () => {
    repo.findPending.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetPendingApprovalsQuery(HitlDocumentType.PAYMENT, 3, 40));

    expect(repo.findPending).toHaveBeenCalledWith({
      documentType: HitlDocumentType.PAYMENT, page: 3, limit: 40,
    });
  });

  it('forwards undefined fields when no filters are supplied', async () => {
    repo.findPending.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetPendingApprovalsQuery());

    expect(repo.findPending).toHaveBeenCalledWith({
      documentType: undefined, page: undefined, limit: undefined,
    });
  });
});
