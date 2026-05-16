/**
 * test/finance/payroll.service.spec.ts
 *
 * Unit tests for finance PayrollService. Mocks IFinancePayrollRepository.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from '../../src/modules/finance/payroll/payroll.service';
import { FINANCE_PAYROLL_REPO } from '../../src/modules/finance/payroll/i-finance-payroll.repo';
import { Ok, Err, AppErr } from '../../src/common/result';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

interface RepoMock {
  findAll: jest.Mock;
  findById: jest.Mock;
  findRowsByPeriodId: jest.Mock;
  create: jest.Mock;
  updateStatus: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    findAll: jest.fn().mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 })),
    findById: jest.fn().mockResolvedValue(Ok({ id: 1, name: 'May-25' })),
    findRowsByPeriodId: jest.fn().mockResolvedValue(Ok([
      { id: 10, grossSalary: 1000 },
      { id: 11, grossSalary: 2000 },
    ])),
    create: jest.fn().mockResolvedValue(Ok({ id: 100 })),
    updateStatus: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    ...overrides,
  };
}

async function buildSvc(repo: RepoMock): Promise<PayrollService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      PayrollService,
      { provide: FINANCE_PAYROLL_REPO, useValue: repo },
    ],
  }).compile();
  return mod.get(PayrollService);
}

describe('finance PayrollService', () => {
  describe('findAll()', () => {
    it('uses page=1, limit=10 defaults', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findAll();

      expect(r.ok).toBe(true);
      expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    });

    it('computes offset for page=2 limit=5', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findAll({ page: 2, limit: 5 });

      expect(repo.findAll).toHaveBeenCalledWith(5, 5);
    });

    it('returns failure when repo errs', async () => {
      const repo = makeRepo({
        findAll: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findAll();

      expect(r.ok).toBe(false);
    });
  });

  describe('findOne()', () => {
    it('returns merged period + rows when found', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const result = await svc.findOne(1);

      expect(result).toHaveProperty('rows');
      expect((result as { rows: unknown[] }).rows).toHaveLength(2);
    });

    it('throws NotFoundException when period missing', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = await buildSvc(repo);

      await expect(svc.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerError when findById repo fails', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      await expect(svc.findOne(1)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('create() / close()', () => {
    it('create delegates to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.create({ name: 'Q1' });

      expect(r.ok).toBe(true);
      expect(repo.create).toHaveBeenCalled();
    });

    it('close transitions status to "closed"', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.close(1);

      expect(r.ok).toBe(true);
      expect(repo.updateStatus).toHaveBeenCalledWith(1, 'closed');
    });
  });

  describe('calculatePeriod()', () => {
    it('computes tax + pension for each row at 12% + 8%', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.calculatePeriod(1);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as {
          totalGross: number;
          totalNet: number;
          employeeCount: number;
          rows: Array<{ incomeTax: number; pensionDeduction: number; netSalary: number }>;
        };
        // gross 1000+2000 = 3000; tax = 360; pension = 240; net = 2400
        expect(d.totalGross).toBe(3000);
        expect(d.totalNet).toBeCloseTo(2400, 2);
        expect(d.employeeCount).toBe(2);
        expect(d.rows[0].incomeTax).toBe(120);
        expect(d.rows[0].pensionDeduction).toBe(80);
        expect(d.rows[0].netSalary).toBe(800);
      }
    });

    it('updates period status to "calculated"', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.calculatePeriod(1);

      expect(repo.updateStatus).toHaveBeenCalledWith(1, 'calculated');
    });

    it('handles empty rows array', async () => {
      const repo = makeRepo({
        findRowsByPeriodId: jest.fn().mockResolvedValue(Ok([])),
      });
      const svc = await buildSvc(repo);

      const r = await svc.calculatePeriod(1);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { employeeCount: number; totalGross: number };
        expect(d.employeeCount).toBe(0);
        expect(d.totalGross).toBe(0);
      }
    });
  });
});
