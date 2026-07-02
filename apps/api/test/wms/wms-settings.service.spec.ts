/**
 * @file wms-settings.service.spec.ts
 * @description Unit tests for WmsSettingsService — the WMS settings hub
 * (generic key-value config, same pattern as marketing_settings /
 * sd_price_formulas / qc_parameters). The service is a thin delegation
 * layer over IWmsSettingsRepo (no business logic of its own), so these
 * tests lock in the delegation contract: each method must forward its
 * arguments to the repo unchanged and propagate the Result verbatim
 * (both success and failure paths) — a regression here (dropped arg,
 * swallowed error, wrong repo method) would silently break every
 * settings screen wired to this service.
 */

import { WmsSettingsService } from '../../src/modules/wms/application/wms-settings.service';
import type { IWmsSettingsRepo } from '../../src/modules/wms/domain/repositories/i-wms-settings.repo';
import { Ok, Err } from '../../src/common/result';

function makeMockRepo(): jest.Mocked<IWmsSettingsRepo> {
  return {
    getAll: jest.fn(),
    saveMany: jest.fn(),
    patchById: jest.fn(),
  };
}

describe('WmsSettingsService', () => {
  let repo: jest.Mocked<IWmsSettingsRepo>;
  let service: WmsSettingsService;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new WmsSettingsService(repo);
  });

  describe('getAll()', () => {
    it('delegates to repo.getAll() and returns its data on success', async () => {
      const rows = [{ id: 'a', value: '1' }, { id: 'b', value: '2' }];
      repo.getAll.mockResolvedValueOnce(Ok(rows));

      const r = await service.getAll();

      expect(repo.getAll).toHaveBeenCalledTimes(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(rows);
    });

    it('propagates repo failure unchanged', async () => {
      repo.getAll.mockResolvedValueOnce(Err({ code: 'DB_ERROR', message: 'boom' }));

      const r = await service.getAll();

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    });
  });

  describe('saveMany()', () => {
    it('forwards the entries map to repo.saveMany() unchanged', async () => {
      const entries = { max_pallet_weight: '1200', fefo_enabled: 'true' };
      repo.saveMany.mockResolvedValueOnce(Ok({ updated: 2 }));

      const r = await service.saveMany(entries);

      expect(repo.saveMany).toHaveBeenCalledWith(entries);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.updated).toBe(2);
    });

    it('propagates repo failure unchanged', async () => {
      repo.saveMany.mockResolvedValueOnce(Err({ code: 'VALIDATION', message: 'bad entry' }));

      const r = await service.saveMany({ x: 'y' });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });
  });

  describe('patchById()', () => {
    it('forwards id and value to repo.patchById() unchanged', async () => {
      repo.patchById.mockResolvedValueOnce(Ok({ id: 'fefo_enabled', updated: true }));

      const r = await service.patchById('fefo_enabled', 'false');

      expect(repo.patchById).toHaveBeenCalledWith('fefo_enabled', 'false');
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.id).toBe('fefo_enabled');
        expect(r.data.updated).toBe(true);
      }
    });

    it('propagates NOT_FOUND when the setting id does not exist', async () => {
      repo.patchById.mockResolvedValueOnce(Err({ code: 'NOT_FOUND', message: 'setting not found' }));

      const r = await service.patchById('does_not_exist', 'x');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });
  });
});
