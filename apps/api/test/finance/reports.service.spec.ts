/**
 * test/finance/reports.service.spec.ts
 *
 * Unit tests for FinanceReportsService. Mocks IFinanceReportsRepository.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FinanceReportsService } from '../../src/modules/finance/reports/reports.service';
import { FINANCE_REPORTS_REPO } from '../../src/modules/finance/reports/i-reports.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findTrialBalance: jest.Mock;
  findProfitLoss: jest.Mock;
  findWeeklySummary: jest.Mock;
  findMonthlySummary: jest.Mock;
  findKpiDashboard: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    findTrialBalance: jest.fn().mockResolvedValue(Ok({ accounts: [] })),
    findProfitLoss: jest.fn().mockResolvedValue(Ok({ revenue: 100, expenses: 50 })),
    findWeeklySummary: jest.fn().mockResolvedValue(Ok({ weeks: [] })),
    findMonthlySummary: jest.fn().mockResolvedValue(Ok({ months: [] })),
    findKpiDashboard: jest.fn().mockResolvedValue(Ok({ kpis: [] })),
    ...overrides,
  };
}

async function buildSvc(repo: RepoMock): Promise<FinanceReportsService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      FinanceReportsService,
      { provide: FINANCE_REPORTS_REPO, useValue: repo },
    ],
  }).compile();
  return mod.get(FinanceReportsService);
}

describe('FinanceReportsService', () => {
  describe('findTrialBalance()', () => {
    it('passes fiscalYear through', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findTrialBalance(2025);

      expect(repo.findTrialBalance).toHaveBeenCalledWith(2025);
    });

    it('omits fiscalYear when undefined', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findTrialBalance();

      expect(repo.findTrialBalance).toHaveBeenCalledWith(undefined);
    });

    it('returns failure when repo errs', async () => {
      const repo = makeRepo({
        findTrialBalance: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findTrialBalance();

      expect(r.ok).toBe(false);
    });
  });

  describe('findProfitLoss()', () => {
    it('passes date range to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findProfitLoss('2025-01-01', '2025-12-31');

      expect(repo.findProfitLoss).toHaveBeenCalledWith('2025-01-01', '2025-12-31');
    });

    it('handles missing date range gracefully', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findProfitLoss();

      expect(r.ok).toBe(true);
      expect(repo.findProfitLoss).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('findWeeklySummary()', () => {
    it('forwards call to repo without args', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findWeeklySummary();

      expect(r.ok).toBe(true);
      expect(repo.findWeeklySummary).toHaveBeenCalled();
    });

    it('returns failure when repo errs', async () => {
      const repo = makeRepo({
        findWeeklySummary: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findWeeklySummary();

      expect(r.ok).toBe(false);
    });
  });

  describe('findMonthlySummary()', () => {
    it('passes year through', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findMonthlySummary(2024);

      expect(repo.findMonthlySummary).toHaveBeenCalledWith(2024);
    });

    it('omits year when undefined', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findMonthlySummary();

      expect(repo.findMonthlySummary).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findKpiDashboard()', () => {
    it('returns dashboard payload', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findKpiDashboard();

      expect(r.ok).toBe(true);
    });

    it('returns failure when repo errs', async () => {
      const repo = makeRepo({
        findKpiDashboard: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findKpiDashboard();

      expect(r.ok).toBe(false);
    });
  });
});
