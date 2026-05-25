/**
 * Smoke spec for MaterialBalanceService (Rule 22: every service needs a unit test).
 */
import { MaterialBalanceService } from '../../src/modules/remaining/material-balance.service';

describe('MaterialBalanceService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    getOverview:         jest.fn().mockResolvedValue({ data: { total_count: 5, total_stock_value: 1000, low_stock_count: 2, critical_stock_count: 1 } }),
    getAlerts:           jest.fn().mockResolvedValue(Ok([
      { current_stock: 0, min_stock: 10 },
      { current_stock: 5, min_stock: 10 },
    ])),
    getInternalRequests: jest.fn().mockResolvedValue(Ok([])),
    approveRequest:      jest.fn().mockResolvedValue({ id: 1 }),
    issueRequest:        jest.fn().mockResolvedValue(Ok({ id: 1 })),
    getProduction:       jest.fn().mockResolvedValue(Ok([])),
    productionAction:    jest.fn().mockResolvedValue(Ok({ ok: true })),
    getNegativeStock:    jest.fn().mockResolvedValue(Ok([])),
  };

  it('class is defined', () => {
    expect(MaterialBalanceService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(MaterialBalanceService.name).toBe('MaterialBalanceService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new MaterialBalanceService(repoStub as never);
    expect(svc).toBeInstanceOf(MaterialBalanceService);
  });

  it('getOverview projects repo row into typed numbers', async () => {
    const svc = new MaterialBalanceService(repoStub as never);
    const res = await svc.getOverview();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = (res.data as { data: { totalMaterials: number; totalStockValue: number } }).data;
      expect(data.totalMaterials).toBe(5);
      expect(data.totalStockValue).toBe(1000);
    }
  });

  it('getAlerts marks zero-stock rows as critical and deficits computed', async () => {
    const svc = new MaterialBalanceService(repoStub as never);
    const res = await svc.getAlerts();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const d = res.data as { criticalCount: number; warningCount: number; total: number };
      expect(d.criticalCount).toBe(1);
      expect(d.warningCount).toBe(1);
      expect(d.total).toBe(2);
    }
  });

  it('takeMaterial delegates to repo.productionAction with action="take"', async () => {
    const svc = new MaterialBalanceService(repoStub as never);
    await svc.takeMaterial({ materialId: 7 });
    expect(repoStub.productionAction).toHaveBeenCalledWith({ materialId: 7 }, 'take');
  });
});
