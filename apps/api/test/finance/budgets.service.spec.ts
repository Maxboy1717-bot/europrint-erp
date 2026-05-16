/**
 * test/finance/budgets.service.spec.ts
 *
 * Unit tests for BudgetsService. Mocks IFinanceBudgetsRepository + I18nService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from '../../src/modules/finance/budgets/budgets.service';
import { FINANCE_BUDGETS_REPO } from '../../src/modules/finance/budgets/i-finance-budgets.repo';
import { Ok, Err, AppErr } from '../../src/common/result';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

interface RepoMock {
  findAll: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  approve: jest.Mock;
  softDelete: jest.Mock;
  findBudgetLines: jest.Mock;
  createBudgetLine: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    findAll:          jest.fn().mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 })),
    findById:         jest.fn().mockResolvedValue(Ok({ id: 1, status: 'draft' })),
    create:           jest.fn().mockResolvedValue(Ok({ id: 99 })),
    update:           jest.fn().mockResolvedValue(Ok({ id: 1 })),
    approve:          jest.fn().mockResolvedValue(Ok({ id: 1, status: 'approved' })),
    softDelete:       jest.fn().mockResolvedValue(Ok(undefined)),
    findBudgetLines:  jest.fn().mockResolvedValue(Ok({ data: [], count: 0 })),
    createBudgetLine: jest.fn().mockResolvedValue(Ok({ id: 1 })),
    ...overrides,
  };
}

function makeI18n(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

async function buildSvc(repo: RepoMock): Promise<BudgetsService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      BudgetsService,
      { provide: FINANCE_BUDGETS_REPO, useValue: repo },
      { provide: I18nService, useValue: makeI18n() },
    ],
  }).compile();
  return mod.get(BudgetsService);
}

describe('BudgetsService', () => {
  describe('findAll()', () => {
    it('returns paginated envelope with defaults page=1 limit=10', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findAll();

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { pagination: { page: number; limit: number; total: number } };
        expect(d.pagination.page).toBe(1);
        expect(d.pagination.limit).toBe(10);
        expect(d.pagination.total).toBe(1);
      }
      expect(repo.findAll).toHaveBeenCalledWith(10, 0);
    });

    it('computes correct offset for page=4 limit=25', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findAll({ page: 4, limit: 25 });

      expect(repo.findAll).toHaveBeenCalledWith(25, 75);
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
    it('throws NotFoundException when data is null', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = await buildSvc(repo);

      await expect(svc.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns row when found', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const row = await svc.findOne(1);

      expect(row).toEqual({ id: 1, status: 'draft' });
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('throws InternalServerError when repo fails', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'fk'))),
      });
      const svc = await buildSvc(repo);

      await expect(svc.findOne(1)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('approve()', () => {
    it('approves a draft budget', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.approve(1);

      expect(r.ok).toBe(true);
      expect(repo.approve).toHaveBeenCalledWith(1);
    });

    it('rejects non-draft budgets via Result.ok=false', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'approved' })),
      });
      const svc = await buildSvc(repo);

      const r = await svc.approve(1);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BAD_REQUEST');
      expect(repo.approve).not.toHaveBeenCalled();
    });
  });

  describe('create() / update() / remove()', () => {
    it('create delegates to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.create({ name: 'Q1' });

      expect(r.ok).toBe(true);
      expect(repo.create).toHaveBeenCalled();
    });

    it('update first checks existence via findOne', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.update(1, { name: 'updated' });

      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(repo.update).toHaveBeenCalled();
    });

    it('remove returns success message', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.remove(1);

      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { message: string };
        expect(d.message).toBeTruthy();
      }
      expect(repo.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('findBudgetLines() / createBudgetLine()', () => {
    it('lines list paginates with defaults page=1 limit=50', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findBudgetLines('B-1');

      expect(repo.findBudgetLines).toHaveBeenCalledWith('B-1', 50, 0);
    });

    it('createBudgetLine forwards to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.createBudgetLine('B-1', { amount: 100 });

      expect(repo.createBudgetLine).toHaveBeenCalledWith('B-1', { amount: 100 });
    });
  });
});
