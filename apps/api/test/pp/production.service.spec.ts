/**
 * test/pp/production.service.spec.ts
 *
 * ProductionService is a thin layer over ProductionRepository for shift
 * reports (production_sessions). listShiftReports is the one method with
 * real logic: it converts a 1-based `page` + `limit` into the `(limit,
 * offset)` pair the repository expects, and wraps the call in `safeCall`
 * so repository throws become a typed `Err` instead of an unhandled
 * rejection. The remaining methods are pure delegation to the repository.
 */

import { ProductionService } from '../../src/modules/pp/production/production.service';
import { ProductionRepository } from '../../src/modules/pp/production/production.repository';

function buildRepo(overrides: Partial<jest.Mocked<ProductionRepository>> = {}): jest.Mocked<ProductionRepository> {
  return {
    listShiftReports: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getShiftReport: jest.fn().mockResolvedValue({ ok: true, data: null }),
    createShiftReport: jest.fn().mockResolvedValue({ ok: true, data: null }),
    updateShiftReport: jest.fn().mockResolvedValue({ ok: true, data: null }),
    closeShiftReport: jest.fn().mockResolvedValue({ ok: true, data: null }),
    addShiftDowntime: jest.fn().mockResolvedValue({ ok: true, data: null }),
    weeklyReport: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getProductionStats: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    getOrder360Card: jest.fn().mockResolvedValue({ ok: true, data: null }),
    ...overrides,
  } as unknown as jest.Mocked<ProductionRepository>;
}

describe('ProductionService', () => {
  describe('listShiftReports', () => {
    it('converts page 1 into offset 0', async () => {
      const repo = buildRepo();
      const svc = new ProductionService(repo);

      await svc.listShiftReports(1, 20);

      expect(repo.listShiftReports).toHaveBeenCalledWith(20, 0);
    });

    it('converts page 3 with limit 10 into offset 20', async () => {
      const repo = buildRepo();
      const svc = new ProductionService(repo);

      await svc.listShiftReports(3, 10);

      expect(repo.listShiftReports).toHaveBeenCalledWith(10, 20);
    });

    it('wraps a successful repository call in an Ok result', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const repo = buildRepo({
        listShiftReports: jest.fn().mockResolvedValue({ ok: true, data: rows }),
      });
      const svc = new ProductionService(repo);

      const result = await svc.listShiftReports(1, 20);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toEqual({ ok: true, data: rows });
    });

    it('turns a repository rejection into an Err result instead of throwing', async () => {
      const repo = buildRepo({
        listShiftReports: jest.fn().mockRejectedValue(new Error('db down')),
      });
      const svc = new ProductionService(repo);

      const result = await svc.listShiftReports(2, 5);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toBe('db down');
    });
  });

  describe('delegation to the repository', () => {
    it('getShiftReport forwards the id and returns the repository result', async () => {
      const repo = buildRepo({
        getShiftReport: jest.fn().mockResolvedValue({ ok: true, data: { id: 7 } }),
      });
      const svc = new ProductionService(repo);

      const result = await svc.getShiftReport(7);

      expect(repo.getShiftReport).toHaveBeenCalledWith(7);
      expect(result).toEqual({ ok: true, data: { id: 7 } });
    });

    it('createShiftReport forwards the body unchanged', async () => {
      const repo = buildRepo({
        createShiftReport: jest.fn().mockResolvedValue({ ok: true, data: { id: 9 } }),
      });
      const svc = new ProductionService(repo);
      const body = { production_order_id: 3, planned_qty: 100 };

      await svc.createShiftReport(body);

      expect(repo.createShiftReport).toHaveBeenCalledWith(body);
    });

    it('updateShiftReport forwards id and body', async () => {
      const repo = buildRepo();
      const svc = new ProductionService(repo);
      const body = { notes: 'ok' };

      await svc.updateShiftReport(4, body);

      expect(repo.updateShiftReport).toHaveBeenCalledWith(4, body);
    });

    it('closeShiftReport forwards id and body', async () => {
      const repo = buildRepo();
      const svc = new ProductionService(repo);
      const body = { outputQty: 50 };

      await svc.closeShiftReport(4, body);

      expect(repo.closeShiftReport).toHaveBeenCalledWith(4, body);
    });

    it('addShiftDowntime forwards id and body', async () => {
      const repo = buildRepo();
      const svc = new ProductionService(repo);
      const body = { duration_min: 15, category: 'unplanned' };

      await svc.addShiftDowntime(4, body);

      expect(repo.addShiftDowntime).toHaveBeenCalledWith(4, body);
    });

    it('weeklyReport forwards the start/end range', async () => {
      const repo = buildRepo();
      const svc = new ProductionService(repo);

      await svc.weeklyReport('2026-06-01', '2026-06-30');

      expect(repo.weeklyReport).toHaveBeenCalledWith('2026-06-01', '2026-06-30');
    });

    it('getProductionStats delegates with no arguments', async () => {
      const repo = buildRepo({
        getProductionStats: jest.fn().mockResolvedValue({ ok: true, data: { active_shifts: 2 } }),
      });
      const svc = new ProductionService(repo);

      const result = await svc.getProductionStats();

      expect(repo.getProductionStats).toHaveBeenCalledWith();
      expect(result).toEqual({ ok: true, data: { active_shifts: 2 } });
    });

    it('getOrder360Card forwards the order id', async () => {
      const repo = buildRepo({
        getOrder360Card: jest.fn().mockResolvedValue({ ok: true, data: { overview: {} } }),
      });
      const svc = new ProductionService(repo);

      await svc.getOrder360Card(42);

      expect(repo.getOrder360Card).toHaveBeenCalledWith(42);
    });
  });
});
