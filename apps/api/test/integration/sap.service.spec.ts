/**
 * test/integration/sap.service.spec.ts
 *
 * Unit tests for SapService — sales-order pass-through to SAP repo.
 * Mocks SapRepository (in-memory).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SapService } from '../../src/modules/integration/sap/sap.service';
import { SapRepository } from '../../src/modules/integration/sap/sap.repository';
import { Ok, Err } from '../../src/common/result';

interface RepoMock {
  listSalesOrders: jest.Mock;
  getSalesOrder: jest.Mock;
  updateSalesOrder: jest.Mock;
}

function makeRepo(overrides: Partial<RepoMock> = {}): RepoMock {
  return {
    listSalesOrders: jest.fn().mockResolvedValue(
      Ok([{ id: 1, order_number: 'SO-001', status: 'open' }]),
    ),
    getSalesOrder: jest.fn().mockResolvedValue(Ok({ id: 1, order_number: 'SO-001' })),
    updateSalesOrder: jest.fn().mockResolvedValue(Ok({ id: 1, status: 'closed' })),
    ...overrides,
  };
}

async function buildSvc(repo: RepoMock): Promise<SapService> {
  const mod: TestingModule = await Test.createTestingModule({
    providers: [
      SapService,
      { provide: SapRepository, useValue: repo },
    ],
  }).compile();
  return mod.get(SapService);
}

describe('SapService', () => {
  describe('listSalesOrders()', () => {
    it('returns Ok with rows when repo succeeds (happy path)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.listSalesOrders('open', 50, 0);

      expect(r.ok).toBe(true);
      if (r.ok) expect(Array.isArray(r.data)).toBe(true);
      expect(repo.listSalesOrders).toHaveBeenCalledWith('open', 50, 0);
    });

    it('returns Err when repo errors (error path)', async () => {
      const repo = makeRepo({
        listSalesOrders: jest.fn().mockResolvedValue(Err('connection refused')),
      });
      const svc = await buildSvc(repo);

      const r = await svc.listSalesOrders(null, 25, 0);

      expect(r.ok).toBe(false);
      expect(repo.listSalesOrders).toHaveBeenCalledWith(null, 25, 0);
    });

    it('passes null status through unchanged (edge case)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.listSalesOrders(null, 100, 200);

      expect(repo.listSalesOrders.mock.calls[0]).toEqual([null, 100, 200]);
    });

    it('passes pagination args (lim/off) verbatim to the repo', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.listSalesOrders('shipped', 10, 30);

      const [statusArg, limArg, offArg] = repo.listSalesOrders.mock.calls[0];
      expect(statusArg).toBe('shipped');
      expect(limArg).toBe(10);
      expect(offArg).toBe(30);
    });
  });

  describe('getSalesOrder()', () => {
    it('returns Ok with the row when repo finds it (happy path)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.getSalesOrder(1);

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual(expect.objectContaining({ id: 1 }));
    });

    it('returns Ok(null) when repo returns null (edge: missing id)', async () => {
      const repo = makeRepo({ getSalesOrder: jest.fn().mockResolvedValue(Ok(null)) });
      const svc = await buildSvc(repo);

      const r = await svc.getSalesOrder(99999);

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when repo errors (error path)', async () => {
      const repo = makeRepo({
        getSalesOrder: jest.fn().mockResolvedValue(Err('db timeout')),
      });
      const svc = await buildSvc(repo);

      const r = await svc.getSalesOrder(5);

      expect(r.ok).toBe(false);
    });
  });

  describe('updateSalesOrder()', () => {
    it('returns Ok with updated row (happy path)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      const r = await svc.updateSalesOrder(1, { status: 'closed' });

      expect(r.ok).toBe(true);
      expect(repo.updateSalesOrder).toHaveBeenCalledWith(1, { status: 'closed' });
    });

    it('forwards an empty body unchanged (edge case)', async () => {
      const repo = makeRepo();
      const svc = await buildSvc(repo);

      await svc.updateSalesOrder(1, {});

      expect(repo.updateSalesOrder).toHaveBeenCalledWith(1, {});
    });

    it('returns Err when repo errors', async () => {
      const repo = makeRepo({
        updateSalesOrder: jest.fn().mockResolvedValue(Err('constraint violation')),
      });
      const svc = await buildSvc(repo);

      const r = await svc.updateSalesOrder(1, { status: 'invalid_state' });

      expect(r.ok).toBe(false);
    });
  });

  it('export sanity: SapService is a class with the three pass-through methods', () => {
    expect(typeof SapService).toBe('function');
    expect(SapService.prototype.listSalesOrders).toBeDefined();
    expect(SapService.prototype.getSalesOrder).toBeDefined();
    expect(SapService.prototype.updateSalesOrder).toBeDefined();
  });
});
