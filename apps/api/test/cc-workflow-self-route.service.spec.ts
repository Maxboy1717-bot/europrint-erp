/**
 * test/cc-workflow-self-route.service.spec.ts
 *
 * CC #21 self_route_blocked (Separation of Duties): the sender can NEVER be
 * their own approver — a document must not land in the sender's own inbox for
 * self-sign-off. Most org-resolver branches (dept-head/position/director/ceo)
 * don't exclude the sender, so CcWorkflowService.createFirstStepApprovals is the
 * catch-all guard: when a resolved approver === senderUserId it skips the
 * approval and journals a `self_route_blocked` audit row.
 */

import { CcWorkflowService } from '../src/modules/communication-center/application/cc-workflow.service';

function build() {
  const docs = {
    logAudit: jest.fn().mockResolvedValue({ ok: true, data: undefined }),
    createApproval: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
  };
  const org = { resolveApprover: jest.fn() };
  // Only docs + org (+ the real Logger) are exercised by createFirstStepApprovals;
  // the remaining deps are unused here.
  const svc = new CcWorkflowService(docs as never, org as never, {} as never, {} as never, {} as never, {} as never);
  return { svc: svc as unknown as { createFirstStepApprovals: (d: unknown, s: number, rows: unknown[]) => Promise<number[]> }, docs, org };
}

const DOC = { id: 'doc-1' };
const step = (order: number, code = 'DEPT_HEAD') => ({
  stepOrder: order, approverPositionCode: code, timeLimitHours: 24, rejectionStops: true,
});

describe('CcWorkflowService self-route guard (CC #21 SoD)', () => {
  it('blocks a self-approval: approver === sender is skipped + journalled, no approval row', async () => {
    const { svc, docs, org } = build();
    org.resolveApprover.mockResolvedValue({ ok: true, data: 7 }); // resolves to the sender

    const approvers = await svc.createFirstStepApprovals(DOC, 7, [step(1)]);

    expect(approvers).toEqual([]);
    expect(docs.createApproval).not.toHaveBeenCalled();
    expect(docs.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: 'doc-1', action: 'self_route_blocked', performedByUserId: null }),
    );
  });

  it('allows a non-sender approver: approval created, no self-route audit', async () => {
    const { svc, docs, org } = build();
    org.resolveApprover.mockResolvedValue({ ok: true, data: 9 }); // a different user

    const approvers = await svc.createFirstStepApprovals(DOC, 7, [step(1)]);

    expect(approvers).toEqual([9]);
    expect(docs.createApproval).toHaveBeenCalledTimes(1);
    expect(docs.logAudit).not.toHaveBeenCalled();
  });

  it('mixed first step: skips the self-resolved row, keeps the other approver', async () => {
    const { svc, docs, org } = build();
    org.resolveApprover
      .mockResolvedValueOnce({ ok: true, data: 7 })   // row A -> sender (blocked)
      .mockResolvedValueOnce({ ok: true, data: 9 });  // row B -> other (kept)

    const approvers = await svc.createFirstStepApprovals(DOC, 7, [step(1, 'DEPT_HEAD'), step(1, 'DIRECTOR')]);

    expect(approvers).toEqual([9]);
    expect(docs.createApproval).toHaveBeenCalledTimes(1);
    expect(docs.logAudit).toHaveBeenCalledTimes(1);
  });
});
