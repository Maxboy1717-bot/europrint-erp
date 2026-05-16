/**
 * Smoke spec for ThreeWayMatchService (Rule 22: every service needs a unit test).
 */
import { ThreeWayMatchService } from '../../src/modules/remaining/three-way-match.service';

describe('ThreeWayMatchService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    getResults:             jest.fn().mockResolvedValue([]),
    getPurchaseOrderAmount: jest.fn().mockResolvedValue(Ok(1000)),
    getGoodsReceiptAmount:  jest.fn().mockResolvedValue(Ok(1000)),
    insertResult:           jest.fn().mockResolvedValue(undefined),
  };

  it('class is defined', () => {
    expect(ThreeWayMatchService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(ThreeWayMatchService.name).toBe('ThreeWayMatchService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new ThreeWayMatchService(repoStub as never);
    expect(svc).toBeInstanceOf(ThreeWayMatchService);
  });

  it('perform returns matched status when amounts agree within tolerance', async () => {
    const svc = new ThreeWayMatchService(repoStub as never);
    const res = await svc.perform({ poId: 1, grId: 2, vendorInvoiceId: 'INV1', invoiceAmount: 1000 }, 7);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const d = res.data as { status: string; paymentBlocked: boolean };
      expect(d.status).toBe('matched');
      expect(d.paymentBlocked).toBe(false);
    }
  });

  it('perform flags discrepancy and blocks payment when amounts diverge', async () => {
    const svc = new ThreeWayMatchService(repoStub as never);
    const res = await svc.perform({ poId: 1, grId: 2, vendorInvoiceId: 'INV2', invoiceAmount: 2000 }, 7);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const d = res.data as { status: string; paymentBlocked: boolean };
      expect(d.status).toBe('discrepancy');
      expect(d.paymentBlocked).toBe(true);
    }
  });

  it('getResults delegates to repo.getResults', async () => {
    const svc = new ThreeWayMatchService(repoStub as never);
    await svc.getResults(null, 10);
    expect(repoStub.getResults).toHaveBeenCalledWith(null, 10);
  });
});
