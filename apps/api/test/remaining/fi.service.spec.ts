/**
 * Smoke spec for FiService (Rule 22: every service needs a unit test).
 */
import { FiService } from '../../src/modules/remaining/fi.service';

describe('FiService', () => {
  const Ok = <T>(data: T) => ({ ok: true, data } as const);
  const repoStub = {
    getRevenue:           jest.fn().mockResolvedValue({ rows: [{ total: 1000 }] }),
    getExpenses:          jest.fn().mockResolvedValue({ rows: [{ total: 400 }] }),
    getUnpaidStats:       jest.fn().mockResolvedValue({ rows: [{ count: 3, amount: 250 }] }),
    getRecentTransactions: jest.fn().mockResolvedValue([]),
    getCostCenters:       jest.fn().mockResolvedValue([]),
    getCostCenter:        jest.fn().mockResolvedValue(null),
    createCostCenter:     jest.fn().mockResolvedValue({ id: '1' }),
    updateCostCenter:     jest.fn().mockResolvedValue({ id: '1' }),
    deleteCostCenter:     jest.fn().mockResolvedValue(true),
    getProfitCenters:     jest.fn().mockResolvedValue([]),
    getGlEntries:         jest.fn().mockResolvedValue(Ok([])),
    getInvoices:          jest.fn().mockResolvedValue(Ok([])),
  };

  it('class is defined', () => {
    expect(FiService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(FiService.name).toBe('FiService');
  });

  it('is constructible with a repo stub', () => {
    const svc = new FiService(repoStub as never);
    expect(svc).toBeInstanceOf(FiService);
  });

  it('getStats aggregates revenue/expenses/unpaid from repo', async () => {
    const svc = new FiService(repoStub as never);
    const res = await svc.getStats();
    expect(res.ok).toBe(true);
    if (res.ok) {
      const d = res.data as { revenue: number; expenses: number; unpaidInvoices: number };
      expect(d.revenue).toBe(1000);
      expect(d.expenses).toBe(400);
      expect(d.unpaidInvoices).toBe(3);
    }
  });

  it('getGlEntries returns paginated empty list when repo returns empty', async () => {
    const svc = new FiService(repoStub as never);
    const res = await svc.getGlEntries(1, 20);
    expect(res.data).toEqual([]);
    expect(res.pagination.page).toBe(1);
    expect(res.pagination.limit).toBe(20);
  });
});
