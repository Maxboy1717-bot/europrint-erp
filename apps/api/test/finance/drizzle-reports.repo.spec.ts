/**
 * test/finance/drizzle-reports.repo.spec.ts
 *
 * Unit tests for DrizzleFinanceReportsRepository. `db` is mocked.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  entries: { id: 'id', amount: 'amount', createdAt: 'createdAt', debitAccountId: 'debitAccountId', creditAccountId: 'creditAccountId', entryDate: 'entryDate' },
  accounts: { id: 'id', code: 'code', name: 'name', type: 'type', isActive: 'isActive' },
  financialKPIs: { id: 'id', kpiDate: 'kpiDate' },
  dailyFinancialMetrics: { metricDate: 'metricDate', totalRevenue: 'totalRevenue', totalExpenses: 'totalExpenses', grossProfit: 'grossProfit' },
}));

import { DrizzleFinanceReportsRepository } from '../../src/modules/finance/reports/drizzle-reports.repo';

describe('DrizzleFinanceReportsRepository', () => {
  let repo: DrizzleFinanceReportsRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleFinanceReportsRepository();
  });

  describe('findTrialBalance', () => {
    it('returns Ok with rows when query succeeds', async () => {
      kit.queueSelect([{ code: '1000', debit: 500, credit: 200 }]);
      const r = await repo.findTrialBalance(2026);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok empty when no rows', async () => {
      kit.queueSelect([]);
      const r = await repo.findTrialBalance();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findTrialBalance(2026);
      expect(r.ok).toBe(false);
    });
  });

  describe('findProfitLoss', () => {
    it('returns Ok with computed net profit', async () => {
      kit.queueSelect([{ total: '1000' }]);
      kit.queueSelect([{ total: '300' }]);
      const r = await repo.findProfitLoss('2026-01-01', '2026-12-31');
      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { totalRevenue: number; netProfit: number };
        expect(d.totalRevenue).toBe(1000);
        expect(d.netProfit).toBe(700);
      }
    });

    it('uses defaults when dates omitted', async () => {
      kit.queueSelect([{ total: '0' }]);
      kit.queueSelect([{ total: '0' }]);
      const r = await repo.findProfitLoss();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.findProfitLoss();
      expect(r.ok).toBe(false);
    });
  });

  describe('findWeeklySummary', () => {
    it('returns Ok with rows', async () => {
      kit.queueSelect([{ date: '2026-05-15', totalRevenue: '100' }]);
      const r = await repo.findWeeklySummary();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { period: string };
        expect(d.period).toBe('weekly');
      }
    });

    it('returns Ok with empty list when nothing', async () => {
      kit.queueSelect([]);
      const r = await repo.findWeeklySummary();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.findWeeklySummary();
      expect(r.ok).toBe(false);
    });
  });

  describe('findMonthlySummary', () => {
    it('returns Ok with rows for given year', async () => {
      kit.queueSelect([{ date: '2026-01-15' }]);
      const r = await repo.findMonthlySummary(2026);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('uses current year when omitted', async () => {
      kit.queueSelect([]);
      const r = await repo.findMonthlySummary();
      expect(r.ok).toBe(true);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.findMonthlySummary();
      expect(r.ok).toBe(false);
    });
  });

  describe('findKpiDashboard', () => {
    it('returns Ok with kpis and total count', async () => {
      kit.queueSelect([{ id: 1 }]);
      kit.queueSelect([{ count: '5' }]);
      const r = await repo.findKpiDashboard();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { total: number };
        expect(d.total).toBe(5);
      }
    });

    it('returns Ok with zero total when empty', async () => {
      kit.queueSelect([]);
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.findKpiDashboard();
      expect(r.ok).toBe(true);
    });

    it('returns Err when db rejects', async () => {
      kit.queueSelect(new Error('down'));
      const r = await repo.findKpiDashboard();
      expect(r.ok).toBe(false);
    });
  });
});
