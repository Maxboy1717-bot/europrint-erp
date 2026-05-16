/**
 * test/director/reject-request.handler.spec.ts
 *
 * Unit tests for RejectRequestHandler. IApprovalRepo and EventEmitter2 are
 * mocked. Real ApprovalRequest aggregate is mutated through reject().
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RejectRequestHandler } from '../../src/modules/director/application/commands/reject-request.handler';
import { RejectRequestCommand } from '../../src/modules/director/application/commands/reject-request.command';
import { ApprovalRequest } from '../../src/modules/director/domain/aggregates/approval-request.aggregate';
import { APPROVAL_REPO } from '../../src/modules/director/domain/repositories/i-approval.repo';
import { HitlDocumentType, ApprovalStatus } from '../../src/modules/director/domain/enums/hitl-document-type.enum';
import { ERP_EVENTS } from '../../src/common/constants/erp-events.constants';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; update: jest.Mock;
  findPending: jest.Mock; findHistory: jest.Mock; findExistingPending: jest.Mock; save: jest.Mock; getStats: jest.Mock;
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

describe('RejectRequestHandler', () => {
  let handler: RejectRequestHandler;
  let repo: RepoMock;
  let emitter: EventEmitter2;
  let emitSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectRequestHandler,
        { provide: APPROVAL_REPO, useValue: repo },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    handler = module.get(RejectRequestHandler);
    emitter = module.get(EventEmitter2);
    emitSpy = jest.spyOn(emitter, 'emit');
  });

  const cmd = new RejectRequestCommand('req-1', 'user-42', 'Budget exceeds quarterly cap');

  it('returns NOT_FOUND when the request does not exist', async () => {
    repo.findById.mockResolvedValue(Err('missing'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when reject reason is too short', async () => {
    repo.findById.mockResolvedValue(Ok(makeRequest()));

    const r = await handler.execute(new RejectRequestCommand('req-1', 'user-42', 'x'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns FORBIDDEN when request status is not pending', async () => {
    repo.findById.mockResolvedValue(Ok(makeRequest(ApprovalStatus.APPROVED)));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
  });

  it('returns INTERNAL when repo.update fails after a successful reject', async () => {
    repo.findById.mockResolvedValue(Ok(makeRequest()));
    repo.update.mockResolvedValue(Err('db gone'));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INTERNAL');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('returns Ok and emits HITL_REJECTED on a happy-path reject', async () => {
    const req = makeRequest();
    repo.findById.mockResolvedValue(Ok(req));

    const r = await handler.execute(cmd);

    expect(r.ok).toBe(true);
    expect(req.status).toBe(ApprovalStatus.REJECTED);
    expect(req.rejectedBy).toBe('user-42');
    expect(req.rejectionReason).toBe('Budget exceeds quarterly cap');
    expect(emitSpy).toHaveBeenCalledWith(ERP_EVENTS.HITL_REJECTED, expect.objectContaining({
      id: 'req-1', rejectedBy: 'user-42', reason: 'Budget exceeds quarterly cap',
    }));
  });
});
