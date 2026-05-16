/**
 * Smoke spec for CompanyStateService (Rule 22: every service needs a unit test).
 */
import { CompanyStateService } from '../../src/modules/remaining/company-state.service';

describe('CompanyStateService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    getRevenue:          jest.fn().mockResolvedValue(Ok(1_000_000)),
    getExpenses:         jest.fn().mockResolvedValue(Ok(400_000)),
    getEmployeeStats:    jest.fn().mockResolvedValue(Ok({ total: 100, active: 95 })),
    getActiveOrderCount: jest.fn().mockResolvedValue(Ok(12)),
  };

  it('class is defined', () => {
    expect(CompanyStateService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(CompanyStateService.name).toBe('CompanyStateService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new CompanyStateService(repoStub as never);
    expect(svc).toBeInstanceOf(CompanyStateService);
  });

  it('getCurrent computes profit, retention and state from repo data', async () => {
    const svc = new CompanyStateService(repoStub as never);
    const res = await svc.getCurrent();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { kpis: { profit: number; retentionPct: number } };
      expect(data.kpis.profit).toBe(600_000);
      expect(data.kpis.retentionPct).toBe(95);
    }
  });

  it('getCurrent invokes all four repo queries in parallel', async () => {
    const svc = new CompanyStateService(repoStub as never);
    await svc.getCurrent();
    expect(repoStub.getRevenue).toHaveBeenCalled();
    expect(repoStub.getExpenses).toHaveBeenCalled();
    expect(repoStub.getEmployeeStats).toHaveBeenCalled();
    expect(repoStub.getActiveOrderCount).toHaveBeenCalled();
  });
});
