/**
 * test/director/get-approval-history.handler.spec.ts
 *
 * Unit tests for GetApprovalHistoryHandler. IApprovalRepo is mocked; the
 * handler is a thin pass-through that forwards filters to findHistory.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetApprovalHistoryHandler } from '../../src/modules/director/application/queries/get-approval-history.handler';
import { GetApprovalHistoryQuery } from '../../src/modules/director/application/queries/get-approval-history.query';
import { ApprovalRequest } from '../../src/modules/director/domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO } from '../../src/modules/director/domain/repositories/i-approval.repo';
import { HitlDocumentType, ApprovalStatus } from '../../src/modules/director/domain/enums/hitl-document-type.enum';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  findHistory: jest.Mock;
  findById: jest.Mock; findPending: jest.Mock; findExistingPending: jest.Mock; save: jest.Mock; update: jest.Mock; getStats: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findHistory: jest.fn(),
    findById: jest.fn(), findPending: jest.fn(), findExistingPending: jest.fn(),
    save: jest.fn(), update: jest.fn(), getStats: jest.fn(),
  };
}

function makeRequest(): ApprovalRequest {
  return new ApprovalRequest(
    'r-1', HitlDocumentType.PURCHASE_ORDER, 'doc-1', 'PO-1', 60_000_000, 'UZS',
    ApprovalStatus.APPROVED, 'user-7', 'user-42', new Date('2026-01-02'), null, null, null, null,
    new Date('2026-01-01'), new Date('2026-01-02'),
  );
}

describe('GetApprovalHistoryHandler', () => {
  let handler: GetApprovalHistoryHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetApprovalHistoryHandler,
        { provide: APPROVAL_REPO, useValue: repo },
      ],
    }).compile();
    handler = module.get(GetApprovalHistoryHandler);
  });

  it('returns the Err result verbatim when repo fails', async () => {
    repo.findHistory.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(new GetApprovalHistoryQuery());

    expect(r.ok).toBe(false);
  });

  it('returns Ok with items + total when repo succeeds', async () => {
    repo.findHistory.mockResolvedValue(Ok({ items: [makeRequest()], total: 1 }));

    const r = await handler.execute(new GetApprovalHistoryQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(1);
      expect(r.data.total).toBe(1);
    }
  });

  it('forwards documentType / status / page / limit filters to the repo', async () => {
    repo.findHistory.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetApprovalHistoryQuery(
      HitlDocumentType.PAYMENT, ApprovalStatus.REJECTED, 2, 50,
    ));

    expect(repo.findHistory).toHaveBeenCalledWith({
      documentType: HitlDocumentType.PAYMENT,
      status: ApprovalStatus.REJECTED,
      page: 2,
      limit: 50,
    });
  });

  it('forwards undefined fields when no filters are supplied', async () => {
    repo.findHistory.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetApprovalHistoryQuery());

    expect(repo.findHistory).toHaveBeenCalledWith({
      documentType: undefined, status: undefined, page: undefined, limit: undefined,
    });
  });
});
