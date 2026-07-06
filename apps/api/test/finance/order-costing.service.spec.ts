/**
 * test/finance/order-costing.service.spec.ts
 *
 * Unit tests for OrderCostingService. Mocks IOrderCostingRepository.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrderCostingService } from '../../src/modules/finance/order-costing/order-costing.service';
import { ORDER_COSTING_REPO } from '../../src/modules/finance/order-costing/i-order-costing.repo';
import { Ok, Err, AppErr } from '../../src/common/result';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

function makeI18n(): I18nService {
  return {
    t: jest.fn().mockImplementation(async (key: string) => key),
    translate: jest.fn().mockImplementation(async (key: string) => key),
  } as unknown as I18nService;
}

interface RepoMock {
  findAll: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  findTopProfitable: jest.Mock;
  findTopLoss: jest.Mock;
  calculate: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    findAll: jest.fn().mockResolvedValue(Ok({ data: [{ id: 1 }], count: 1 })),
    findById: jest.fn().mockResolvedValue(Ok({ id: 1, orderNumber: 'PO-1' })),
    create: jest.fn().mockResolvedValue(Ok({ id: 99 })),
    findTopProfitable: jest.fn().mockResolvedValue(Ok([{ id: 1, profit: 5000 }])),
    findTopLoss: jest.fn().mockResolvedValue(Ok([{ id: 2, loss: -300 }])),
    calculate: jest.fn().mockResolvedValue(Ok({ id: 1, totalCost: 1234 })),
    ...overrides,
  };
}

async function buildSvc(repo: RepoMock): Promise<OrderCostingService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      OrderCostingService,
      { provide: ORDER_COSTING_REPO, useValue: repo },
      { provide: I18nService, useValue: makeI18n() },
    ],
  }).compile();
  return mod.get(OrderCostingService);
}

describe('OrderCostingService', () => {
  describe('findAll()', () => {
    it('uses page=1 limit=20 defaults', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.findAll();

      expect(r.ok).toBe(true);
      expect(repo.findAll).toHaveBeenCalledWith(20, 0);
    });

    it('computes offset for page=2 limit=10', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findAll({ page: 2, limit: 10 });

      expect(repo.findAll).toHaveBeenCalledWith(10, 10);
    });

    it('returns failure when repo errs', async () => {
      const repo = makeRepo({
        findAll: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'fk'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.findAll();

      expect(r.ok).toBe(false);
    });
  });

  describe('findById()', () => {
    it('returns row when found', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const row = await svc.findById(1);

      expect(row).toEqual({ id: 1, orderNumber: 'PO-1' });
    });

    it('throws NotFoundException when row null', async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = await buildSvc(repo);

      await expect(svc.findById(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerError when repo fails', async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      await expect(svc.findById(1)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findTopProfitable() / findTopLoss()', () => {
    it('caps top profitable at 50', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findTopProfitable(200);

      expect(repo.findTopProfitable).toHaveBeenCalledWith(50);
    });

    it('respects requested limit under cap', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findTopProfitable(5);

      expect(repo.findTopProfitable).toHaveBeenCalledWith(5);
    });

    it('defaults to 10 when no limit', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.findTopLoss();

      expect(repo.findTopLoss).toHaveBeenCalledWith(10);
    });
  });

  describe('calculate()', () => {
    it('verifies existence first then triggers calc', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.calculate(1);

      expect(r.ok).toBe(true);
      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(repo.calculate).toHaveBeenCalledWith(1);
    });

    it('returns failure when repo calculate errs', async () => {
      const repo = makeRepo({
        calculate: jest.fn().mockResolvedValue(Err(AppErr('DB_ERROR', 'down'))),
      });
      const svc = await buildSvc(repo);

      const r = await svc.calculate(1);

      expect(r.ok).toBe(false);
    });
  });

  describe('create()', () => {
    it('delegates to repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.create({ orderNumber: 'PO-X' });

      expect(r.ok).toBe(true);
      expect(repo.create).toHaveBeenCalled();
    });
  });
});
