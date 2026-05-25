/**
 * test/director/approve-request.handler.spec.ts
 *
 * Unit tests for ApproveRequestHandler. IApprovalRepo and EventEmitter2 are
 * mocked. A real ApprovalRequest aggregate is mutated through approve().
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ApproveRequestHandler } from '../../src/modules/director/application/commands/approve-request.handler';
import { ApproveRequestCommand } from '../../src/modules/director/application/commands/approve-request.command';
import { ApprovalRequest } from '../../src/modules/director/domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO } from '../../src/modules/director/domain/repositories/i-approval.repo';
import { HitlDocumentType, ApprovalStatus } from '../../src/modules/director/domain/enums/hitl-document-type.enum';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock;
  update: jest.Mock;
  findPending: jest.Mock; findHistory: jest.Mock; findExistingPending: jest.Mock;
  save: jest.Mock; getStats: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(), update: jest.fn().mockResolvedValue(Ok({})),
    findPending: jest.fn(), findHistory: jest.fn(), findExistingPending: jest.fn(),
    save: jest.fn(), getStats: jest.fn(),
  };
}

function makeRequest(status: ApprovalStatus = ApprovalStatus.PENDING): ApprovalRequest {
  return new ApprovalRequest(
    'req-1', HitlDocumentType.PURCHASE_ORDER, 'doc-1', 'PO-1', 60_000_000, 'UZS',
    status, 'user-7', null, null, null, null, null, null,
    new Date('2026-01-01'), new Date('2026-01-01'),
  );
}

describe('ApproveRequestHandler', () => {
  let handler: ApproveRequestHandler;
  let repo: RepoMock;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApproveRequestHandler,
        { provide: APPROVAL_REPO, useValue: repo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    handler = module.get(ApproveRequestHandler);
    publishSpy = jest.spyOn(module.get(EventBus), 'publish');
  });

  const cmd = new ApproveRequestCommand('req-1', 'user-42', 'Approved by CFO');

  it('returns NOT_FOUND when the request does not exist', async () => {
    repo.findById.mockResolvedValue(Err('missing'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns FORBIDDEN when approve() throws on non-pending status', async () => {
    repo.findById.mockResolvedValue(Ok(makeRequest(ApprovalStatus.APPROVED)));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns INTERNAL when repo update fails after a successful transition', async () => {
    repo.findById.mockResolvedValue(Ok(makeRequest()));
    repo.update.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns Ok and emits HITL_APPROVED on a happy-path approve', async () => {
    const req = makeRequest();
    repo.findById.mockResolvedValue(Ok(req));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    expect(req.status).toBe(ApprovalStatus.APPROVED);
    expect(req.approvedBy).toBe('user-42');
    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: 'req-1', approvedBy: 'user-42', notes: 'Approved by CFO',
    }));
  });
});
