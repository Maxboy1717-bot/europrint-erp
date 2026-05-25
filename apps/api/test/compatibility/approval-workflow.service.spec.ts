/**
 * Smoke spec for ApprovalWorkflowService (Rule 22: every service needs a unit test).
 *
 * Uses a stubbed ApprovalWorkflowRepo returning empty Result lists.
 */
import { ApprovalWorkflowService } from '../../src/modules/compatibility/approval-workflow.service';

describe('ApprovalWorkflowService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    findAll:     jest.fn().mockResolvedValue(Ok([])),
    findPending: jest.fn().mockResolvedValue(Ok([])),
    findByType:  jest.fn().mockResolvedValue(Ok([])),
    findById:    jest.fn().mockResolvedValue(Ok({ id: '1', status: 'pending' })),
  };

  it('class is defined', () => {
    expect(ApprovalWorkflowService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(ApprovalWorkflowService.name).toBe('ApprovalWorkflowService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new ApprovalWorkflowService(repoStub as never);
    expect(svc).toBeInstanceOf(ApprovalWorkflowService);
  });

  it('getDashboard aggregates counts (zero on empty data)', async () => {
    const svc = new ApprovalWorkflowService(repoStub as never);
    const res = await svc.getDashboard();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.total).toBe(0);
      expect(res.data.pending).toBe(0);
      expect(res.data.approved).toBe(0);
      expect(res.data.rejected).toBe(0);
      expect(typeof res.data.updatedAt).toBe('string');
    }
  });

  it('getPending delegates to repo.findPending', async () => {
    const svc = new ApprovalWorkflowService(repoStub as never);
    const res = await svc.getPending();
    expect(res.ok).toBe(true);
    expect(repoStub.findPending).toHaveBeenCalled();
  });
});
