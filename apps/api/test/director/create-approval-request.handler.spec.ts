/**
 * test/director/create-approval-request.handler.spec.ts
 *
 * Unit tests for CreateApprovalRequestHandler. The repo + EventEmitter2 are
 * mocked. Real ApprovalRequest aggregate is built inside the handler.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateApprovalRequestHandler } from '../../src/modules/director/application/commands/create-approval-request.handler';
import { CreateApprovalRequestCommand } from '../../src/modules/director/application/commands/create-approval-request.command';
import { ApprovalRequest } from '../../src/modules/director/domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO } from '../../src/modules/director/domain/repositories/i-approval.repo';
import { HitlDocumentType, ApprovalStatus } from '../../src/modules/director/domain/enums/hitl-document-type.enum';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  findExistingPending: jest.Mock; save: jest.Mock;
  findById: jest.Mock; findPending: jest.Mock; findHistory: jest.Mock; update: jest.Mock; getStats: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findExistingPending: jest.fn().mockResolvedValue(Ok(null)),
    save: jest.fn(),
    findById: jest.fn(), findPending: jest.fn(), findHistory: jest.fn(), update: jest.fn(), getStats: jest.fn(),
  };
}

function makeExistingRequest(): ApprovalRequest {
  return new ApprovalRequest(
    'existing-1', HitlDocumentType.PURCHASE_ORDER, 'doc-1', 'PO-1', 60_000_000, 'UZS',
    ApprovalStatus.PENDING, 'user-7', null, null, null, null, null, null,
    new Date('2026-01-01'), new Date('2026-01-01'),
  );
}

describe('CreateApprovalRequestHandler', () => {
  let handler: CreateApprovalRequestHandler;
  let repo: RepoMock;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateApprovalRequestHandler,
        { provide: APPROVAL_REPO, useValue: repo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    handler = module.get(CreateApprovalRequestHandler);
    publishSpy = jest.spyOn(module.get(EventBus), 'publish');
  });

  const cmd = new CreateApprovalRequestCommand(
    HitlDocumentType.PURCHASE_ORDER, 'doc-1', 'PO-2026-1', 60_000_000, 'UZS', 'user-7', null,
  );

  it('returns the existing approval (idempotent) when a pending one already exists', async () => {
    const existing = makeExistingRequest();
    repo.findExistingPending.mockResolvedValue(Ok(existing));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(existing);
    expect(repo.save).not.toHaveBeenCalled();
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns Err when findExistingPending fails', async () => {
    repo.findExistingPending.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
  });

  it('returns Err when save fails', async () => {
    repo.save.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    expect(publishSpy).not.toHaveBeenCalled();
  });

  it('returns Ok and emits HITL_APPROVAL_REQUESTED on successful save', async () => {
    const saved = makeExistingRequest();
    repo.save.mockResolvedValue(Ok(saved));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: saved.id, amount: saved.amount, requestedBy: saved.requestedBy,
    }));
  });

  it('builds a PENDING approval with the command fields when saving', async () => {
    repo.save.mockImplementation(async (a) => Ok(a as ApprovalRequest));

    await handler.execute(cmd);

    const saved = repo.save.mock.calls[0][0] as ApprovalRequest;
    expect(saved.status).toBe(ApprovalStatus.PENDING);
    expect(saved.documentType).toBe(HitlDocumentType.PURCHASE_ORDER);
    expect(saved.amount).toBe(60_000_000);
    expect(saved.requestedBy).toBe('user-7');
  });
});
