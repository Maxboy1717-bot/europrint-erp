/**
 * test/wms/warehouses.service.spec.ts
 *
 * Unit tests for WarehousesService. IWmsWarehousesRepository + I18nService are
 * mocked (constructed directly, mirroring wms-quarantine-gate.service.spec.ts)
 * so the service's pagination/validation logic can be exercised without a DB.
 */
import { NotFoundException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { WarehousesService } from '../../src/modules/wms/warehouses/warehouses.service';
import type { IWmsWarehousesRepository } from '../../src/modules/wms/warehouses/i-wms-warehouses.repo';
import { Ok, Err } from '../../src/common/result';

function makeRepoMock(): jest.Mocked<IWmsWarehousesRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findZonesByWarehouseId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };
}

function makeI18nMock(message = 'mocked message'): jest.Mocked<Pick<I18nService, 't'>> {
  return { t: jest.fn().mockResolvedValue(message) };
}

describe('WarehousesService', () => {
  let repo: jest.Mocked<IWmsWarehousesRepository>;
  let i18n: jest.Mocked<Pick<I18nService, 't'>>;
  let service: WarehousesService;

  beforeEach(() => {
    repo = makeRepoMock();
    i18n = makeI18nMock();
    service = new WarehousesService(repo, i18n as unknown as I18nService);
  });

  describe('findAll (pagination logic)', () => {
    it('defaults to page 1, limit 10, offset 0, activeOnly false when query is empty', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      const result = await service.findAll({});

      expect(result.ok).toBe(true);
      expect(repo.findAll).toHaveBeenCalledWith(10, 0, false);
      if (result.ok) {
        expect(result.data).toEqual({ data: [], pagination: { total: 0, page: 1, limit: 10 } });
      }
    });

    it('clamps limit to MAX_PAGE_LIMIT (100) when a larger limit is requested', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      await service.findAll({ limit: 500 });

      expect(repo.findAll).toHaveBeenCalledWith(100, 0, false);
    });

    it('clamps limit to a minimum of 1 when a non-positive limit is requested', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      await service.findAll({ limit: -5 });

      expect(repo.findAll).toHaveBeenCalledWith(1, 0, false);
    });

    it('computes offset from page and limit (page=3, limit=20 -> offset=40)', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      const result = await service.findAll({ page: 3, limit: 20 });

      expect(repo.findAll).toHaveBeenCalledWith(20, 40, false);
      if (result.ok) {
        expect(result.data).toEqual(
          expect.objectContaining({ pagination: { total: 0, page: 3, limit: 20 } }),
        );
      }
    });

    it('treats isActive="true" (string, as sent by query params) as activeOnly=true', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      await service.findAll({ isActive: 'true' });

      expect(repo.findAll).toHaveBeenCalledWith(10, 0, true);
    });

    it('treats isActive=true (boolean) as activeOnly=true', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      await service.findAll({ isActive: true });

      expect(repo.findAll).toHaveBeenCalledWith(10, 0, true);
    });

    it('treats isActive="false" (string) as activeOnly=false', async () => {
      repo.findAll.mockResolvedValue(Ok({ data: [], count: 0 }));

      await service.findAll({ isActive: 'false' });

      expect(repo.findAll).toHaveBeenCalledWith(10, 0, false);
    });

    it('returns the repo rows and total under data/pagination', async () => {
      const rows = [{ id: 1, name: 'Main WH' }, { id: 2, name: 'Free WH' }];
      repo.findAll.mockResolvedValue(Ok({ data: rows, count: 2 }));

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({
          data: rows,
          pagination: { total: 2, page: 1, limit: 10 },
        });
      }
    });

    it('propagates a repo failure as a not-ok Result (EXTERNAL_SERVICE default code)', async () => {
      repo.findAll.mockResolvedValue(Err({ code: 'DB_ERROR', message: 'boom' }));

      const result = await service.findAll({});

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('EXTERNAL_SERVICE');
    });
  });

  describe('findOne', () => {
    it('combines the warehouse row with its zones on success', async () => {
      repo.findById.mockResolvedValue(Ok({ id: 1, name: 'Main WH' }));
      repo.findZonesByWarehouseId.mockResolvedValue(Ok([{ id: 10, code: 'A1' }]));

      const result = await service.findOne(1);

      expect(result).toEqual({ id: 1, name: 'Main WH', zones: [{ id: 10, code: 'A1' }] });
      expect(repo.findZonesByWarehouseId).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException (translated via i18n) when the warehouse does not exist', async () => {
      repo.findById.mockResolvedValue(Ok(null));

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(i18n.t).toHaveBeenCalledWith('errors.warehouseNotFound');
    });
  });

  describe('create', () => {
    it('returns the created row wrapped in Ok on success', async () => {
      const created = { id: 5, name: 'New WH' };
      repo.create.mockResolvedValue(Ok(created));

      const result = await service.create({ name: 'New WH' });

      expect(result).toEqual(Ok(created));
      expect(repo.create).toHaveBeenCalledWith({ name: 'New WH' });
    });

    it('returns a not-ok Result when repo.create fails', async () => {
      repo.create.mockResolvedValue(Err({ code: 'DB_ERROR', message: 'insert failed' }));

      const result = await service.create({ name: 'Bad WH' });

      expect(result.ok).toBe(false);
    });
  });

  describe('update', () => {
    it('validates existence via findOne before delegating to repo.update', async () => {
      repo.findById.mockResolvedValue(Ok({ id: 1, name: 'Main WH' }));
      repo.findZonesByWarehouseId.mockResolvedValue(Ok([]));
      repo.update.mockResolvedValue(Ok({ id: 1, name: 'Renamed WH' }));

      const result = await service.update(1, { name: 'Renamed WH' });

      expect(result).toEqual(Ok({ id: 1, name: 'Renamed WH' }));
      expect(repo.update).toHaveBeenCalledWith(1, { name: 'Renamed WH' });
    });

    it('returns a not-ok Result with NOT_FOUND when the warehouse does not exist', async () => {
      repo.findById.mockResolvedValue(Ok(null));

      const result = await service.update(999, { name: 'X' });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('validates existence via findOne, then deactivates and returns the i18n message', async () => {
      repo.findById.mockResolvedValue(Ok({ id: 1, name: 'Main WH' }));
      repo.findZonesByWarehouseId.mockResolvedValue(Ok([]));
      repo.deactivate.mockResolvedValue(Ok(undefined));
      i18n.t.mockResolvedValue('Warehouse deactivated');

      const result = await service.deactivate(1);

      expect(result).toEqual(Ok({ message: 'Warehouse deactivated', code: 'WAREHOUSE_DEACTIVATED' }));
      expect(repo.deactivate).toHaveBeenCalledWith(1);
    });

    it('returns a not-ok Result with NOT_FOUND when the warehouse does not exist', async () => {
      repo.findById.mockResolvedValue(Ok(null));

      const result = await service.deactivate(999);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      expect(repo.deactivate).not.toHaveBeenCalled();
    });
  });
});
