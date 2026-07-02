/**
 * test/wms/warehouse-rental.service.spec.ts
 *
 * Unit tests for WarehouseRentalService. The service is a thin
 * pass-through orchestration layer over IWarehouseRentalRepo — no DB,
 * no NestJS DI container needed. These tests build the service directly
 * with a mock repo and assert that each public method:
 *   1. forwards its arguments to the correct repo method unchanged, and
 *   2. returns the repo's Result unchanged (both Ok and Err paths).
 */

import { WarehouseRentalService } from '../../src/modules/wms/application/warehouse-rental.service';
import type { IWarehouseRentalRepo } from '../../src/modules/wms/domain/repositories/i-warehouse-rental.repo';
import { Ok, Err, AppErr } from '../../src/common/result';

function makeMockRepo(): jest.Mocked<IWarehouseRentalRepo> {
  return {
    getRecords: jest.fn(),
    createRecord: jest.fn(),
    getSummary: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    closeRecord: jest.fn(),
    markPaid: jest.fn(),
  };
}

describe('WarehouseRentalService', () => {
  it('is defined', () => {
    expect(WarehouseRentalService).toBeDefined();
    expect(WarehouseRentalService.name).toBe('WarehouseRentalService');
  });

  describe('getRecords', () => {
    it('forwards the status filter to the repo and returns its Result', async () => {
      const repo = makeMockRepo();
      const rows = [{ id: 1, status: 'active' }];
      repo.getRecords.mockResolvedValue(Ok(rows));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.getRecords('active');

      expect(repo.getRecords).toHaveBeenCalledWith('active');
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual(rows);
    });

    it('works with no status filter (undefined)', async () => {
      const repo = makeMockRepo();
      repo.getRecords.mockResolvedValue(Ok([]));
      const svc = new WarehouseRentalService(repo);

      await svc.getRecords();

      expect(repo.getRecords).toHaveBeenCalledWith(undefined);
    });

    it('propagates repo errors unchanged', async () => {
      const repo = makeMockRepo();
      repo.getRecords.mockResolvedValue(Err(AppErr('DB_ERROR', 'boom')));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.getRecords('closed');

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
    });
  });

  describe('createRecord', () => {
    it('forwards body and userId to the repo', async () => {
      const repo = makeMockRepo();
      const created = { id: 5, tenant: 'Acme' };
      repo.createRecord.mockResolvedValue(Ok(created));
      const svc = new WarehouseRentalService(repo);
      const body = { tenant: 'Acme', area: 100 };

      const res = await svc.createRecord(body, 7);

      expect(repo.createRecord).toHaveBeenCalledWith(body, 7);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual(created);
    });

    it('supports a null userId (e.g. system-created record)', async () => {
      const repo = makeMockRepo();
      repo.createRecord.mockResolvedValue(Ok({ id: 6 }));
      const svc = new WarehouseRentalService(repo);

      await svc.createRecord({ tenant: 'System' }, null);

      expect(repo.createRecord).toHaveBeenCalledWith({ tenant: 'System' }, null);
    });
  });

  describe('getSummary', () => {
    it('returns the repo summary unchanged', async () => {
      const repo = makeMockRepo();
      const summary = { totalArea: 500, occupied: 300 };
      repo.getSummary.mockResolvedValue(Ok(summary));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.getSummary();

      expect(repo.getSummary).toHaveBeenCalledTimes(1);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual(summary);
    });
  });

  describe('getSettings / updateSettings', () => {
    it('getSettings returns repo settings unchanged', async () => {
      const repo = makeMockRepo();
      const settings = { ratePerSqm: 12.5 };
      repo.getSettings.mockResolvedValue(Ok(settings));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.getSettings();

      expect(repo.getSettings).toHaveBeenCalledTimes(1);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual(settings);
    });

    it('updateSettings forwards body to the repo', async () => {
      const repo = makeMockRepo();
      const body = { ratePerSqm: 15 };
      repo.updateSettings.mockResolvedValue(Ok(body));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.updateSettings(body);

      expect(repo.updateSettings).toHaveBeenCalledWith(body);
      expect(res.ok).toBe(true);
    });
  });

  describe('closeRecord', () => {
    it('forwards id and userId to the repo', async () => {
      const repo = makeMockRepo();
      repo.closeRecord.mockResolvedValue(Ok({ id: 3, status: 'closed' }));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.closeRecord(3, 9);

      expect(repo.closeRecord).toHaveBeenCalledWith(3, 9);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual({ id: 3, status: 'closed' });
    });

    it('propagates a NOT_FOUND error from the repo', async () => {
      const repo = makeMockRepo();
      repo.closeRecord.mockResolvedValue(Err(AppErr('NOT_FOUND', 'record not found')));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.closeRecord(999, 9);

      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('NOT_FOUND');
    });
  });

  describe('markPaid', () => {
    it('forwards id, userId, and optional notes to the repo', async () => {
      const repo = makeMockRepo();
      repo.markPaid.mockResolvedValue(Ok({ id: 4, paid: true }));
      const svc = new WarehouseRentalService(repo);

      const res = await svc.markPaid(4, 11, 'paid in cash');

      expect(repo.markPaid).toHaveBeenCalledWith(4, 11, 'paid in cash');
      expect(res.ok).toBe(true);
    });

    it('works when notes is omitted', async () => {
      const repo = makeMockRepo();
      repo.markPaid.mockResolvedValue(Ok({ id: 4, paid: true }));
      const svc = new WarehouseRentalService(repo);

      await svc.markPaid(4, 11);

      expect(repo.markPaid).toHaveBeenCalledWith(4, 11, undefined);
    });
  });
});
