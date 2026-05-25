/**
 * Smoke spec for OrderStatusService (Rule 22: every service needs a unit test).
 */
import { OrderStatusService, STATUS_TRANSITIONS } from '../../src/modules/remaining/order-status.service';

describe('OrderStatusService', () => {
  const repoStub = {
    getStatusLog:           jest.fn().mockResolvedValue([]),
    insertTransitionLog:    jest.fn().mockResolvedValue({ id: '1' }),
    updateOrderStatus:      jest.fn().mockResolvedValue(undefined),
    insertDesignApprovalLog: jest.fn().mockResolvedValue(undefined),
  };

  it('class is defined', () => {
    expect(OrderStatusService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(OrderStatusService.name).toBe('OrderStatusService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new OrderStatusService(repoStub as never);
    expect(svc).toBeInstanceOf(OrderStatusService);
  });

  it('getStatusChain returns full STATUS_TRANSITIONS keys as chain', () => {
    const svc = new OrderStatusService(repoStub as never);
    const res = svc.getStatusChain();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.chain).toEqual(Object.keys(STATUS_TRANSITIONS));
      expect(res.data.transitions).toBe(STATUS_TRANSITIONS);
    }
  });

  it('qcResult transitions to ready_for_fg_warehouse when passed=true', async () => {
    const svc = new OrderStatusService(repoStub as never);
    const res = await svc.qcResult('o1', { passed: true });
    expect(res.ok).toBe(true);
    expect(repoStub.updateOrderStatus).toHaveBeenCalledWith('o1', 'ready_for_fg_warehouse');
  });

  it('qcResult transitions to qc_failed when passed=false', async () => {
    const svc = new OrderStatusService(repoStub as never);
    const res = await svc.qcResult('o2', { passed: false });
    expect(res.ok).toBe(true);
    expect(repoStub.updateOrderStatus).toHaveBeenCalledWith('o2', 'qc_failed');
  });
});
