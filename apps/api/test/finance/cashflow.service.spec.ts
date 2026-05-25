/**
 * test/finance/cashflow.service.spec.ts
 *
 * Unit tests for CashflowService. Mocks ICashflowRepository.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CashflowService } from '../../src/modules/finance/cashflow/cashflow.service';
import { CASHFLOW_REPO } from '../../src/modules/finance/cashflow/i-cashflow.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findTransactions: jest.Mock;
  createTransaction: jest.Mock;
  findDailySummary: jest.Mock;
  findForecast: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    findTransactions: jest.fn().mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 })),
    createTransaction: jest.fn().mockResolvedValue(Ok({ id: 10 })),
    findDailySummary:  jest.fn().mockResolvedValue(Ok({ inflows: 100, outflows: 50 })),
    findForecast:      jest.fn().mockResolvedValue(Ok({ days: 7, forecast: [] })),
    ...overrides,
  };
}

async function buildSvc(repo: RepoMock): Promise<CashflowService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      CashflowService,
      { provide: CASHFLOW_REPO, useValue: repo },
    ],
  }).compile();
  return mod.get(CashflowService);
}

describe('CashflowService', () => {
  describe('findTransactions()', () => {
    it('uses defaults page=1 limit=20 when empty query', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findTransactions();

      expect(r.ok).toBe(true);
      expect(repo.findTransactions).toHaveBeenCalledWith(20, 0);
    });

    it('computes offset for page=3 limit=10', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findTransactions({ page: 3, limit: 10 });

      expect(repo.findTransactions).toHaveBeenCalledWith(10, 20);
    });

    it('returns failure Result when repo errs', async () => {
      const repo = makeRepo({
        findTransactions: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findTransactions();

      expect(r.ok).toBe(false);
    });

    it('returns Ok envelope shape with pagination', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findTransactions({ page: 1, limit: 5 });

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { data: unknown[]; pagination: { total: number; page: number; limit: number } };
        expect(d.pagination.limit).toBe(5);
      }
    });
  });

  describe('createTransaction()', () => {
    it('delegates to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.createTransaction({ amount: 500 });

      expect(r.ok).toBe(true);
      expect(repo.createTransaction).toHaveBeenCalledWith({ amount: 500 });
    });

    it('returns Err when repo write fails', async () => {
      const repo = makeRepo({
        createTransaction: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'fk'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.createTransaction({ amount: 100 });

      expect(r.ok).toBe(false);
    });
  });

  describe('findDailySummary()', () => {
    it('passes date through to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findDailySummary('2025-05-15');

      expect(repo.findDailySummary).toHaveBeenCalledWith('2025-05-15');
    });

    it('omits date when not provided', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findDailySummary();

      expect(repo.findDailySummary).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findForecast()', () => {
    it('clamps days below 1 to 1', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findForecast(0);

      expect(repo.findForecast).toHaveBeenCalledWith(1);
    });

    it('clamps days above 90 to 90', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findForecast(999);

      expect(repo.findForecast).toHaveBeenCalledWith(90);
    });

    it('uses default 7 when undefined', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findForecast();

      expect(repo.findForecast).toHaveBeenCalledWith(7);
    });

    it('passes valid days range through', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findForecast(14);

      expect(repo.findForecast).toHaveBeenCalledWith(14);
    });
  });
});
