/**
 * test/mro/maintenance/maintenance.service.spec.ts
 *
 * Behavioural unit tests for MaintenanceService — covers the pure/testable
 * business logic (Rule 22): type normalization, row mapping (assetName /
 * cost coercion), pagination clamping, equipment-name defaulting on create,
 * and status-bucket counting in getStats. The injected repository is a
 * lightweight jest.fn() stub (no DB/network), matching the pattern used in
 * test/qc/dpmo.service.spec.ts.
 */

import { MaintenanceService } from '../../../src/modules/mro/maintenance/maintenance.service';
import type { IMaintenanceSvcRepository } from '../../../src/modules/mro/maintenance/i-maintenance-svc.repo';
import { Ok, Err } from '@common/result';

function makeRepo(overrides: Partial<IMaintenanceSvcRepository> = {}): jest.Mocked<IMaintenanceSvcRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findEquipment: jest.fn(),
    createEquipment: jest.fn(),
    updateEquipmentStatus: jest.fn(),
    findFacilities: jest.fn(),
    findCleaningSchedules: jest.fn(),
    findPmSchedules: jest.fn(),
    findUtilityReadings: jest.fn(),
    getCanteenStats: jest.fn(),
    listCanteenLogs: jest.fn(),
    createCanteenLog: jest.fn(),
    updateCanteenLog: jest.fn(),
    findSpareParts: jest.fn(),
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
    patchSetting: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<IMaintenanceSvcRepository>;
}

describe('MaintenanceService.normalizeType', () => {
  const svc = new MaintenanceService(makeRepo());

  it('uppercases a given type', () => {
    expect(svc.normalizeType('preventive')).toBe('PREVENTIVE');
  });

  it('falls back to CORRECTIVE when empty', () => {
    expect(svc.normalizeType('')).toBe('CORRECTIVE');
  });

  it('falls back to CORRECTIVE when undefined', () => {
    expect(svc.normalizeType(undefined as unknown as string)).toBe('CORRECTIVE');
  });
});

describe('MaintenanceService.findAll', () => {
  it('maps rows: assetName from equipmentName, normalized type, coerced cost', async () => {
    const repo = makeRepo({
      findAll: jest.fn().mockResolvedValue(Ok([
        { id: 1, equipmentName: 'Press-1', maintenanceType: 'preventive', cost: '150.5' },
        { id: 2, equipmentName: 'Press-2', type: 'corrective', cost: 'not-a-number' },
      ])),
    });
    const svc = new MaintenanceService(repo);

    const r = await svc.findAll({});
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const { data } = r.data as { data: Array<Record<string, unknown>> };
    expect(data[0].assetName).toBe('Press-1');
    expect(data[0].type).toBe('PREVENTIVE');
    expect(data[0].cost).toBe(150.5);
    // invalid cost coerces to 0, not NaN
    expect(data[1].type).toBe('CORRECTIVE');
    expect(data[1].cost).toBe(0);
  });

  it('defaults to page=1 limit=10 and slices/reports total correctly', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, equipmentName: `Eq-${i + 1}`, cost: 0 }));
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(Ok(rows)) });
    const svc = new MaintenanceService(repo);

    const r = await svc.findAll({});
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const page = r.data as { data: unknown[]; total: number; page: number; limit: number };
    expect(page.page).toBe(1);
    expect(page.limit).toBe(10);
    expect(page.total).toBe(25);
    expect(page.data).toHaveLength(10);
  });

  it('clamps non-finite/invalid page and limit to safe defaults, and caps limit at 200', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, equipmentName: `Eq-${i + 1}`, cost: 0 }));
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(Ok(rows)) });
    const svc = new MaintenanceService(repo);

    const negativePage = await svc.findAll({ page: -3, limit: 5000 });
    expect(negativePage.ok).toBe(true);
    if (negativePage.ok) {
      const page = negativePage.data as { page: number; limit: number };
      expect(page.page).toBe(1);
      expect(page.limit).toBe(200);
    }

    const garbage = await svc.findAll({ page: 'abc', limit: 'xyz' });
    expect(garbage.ok).toBe(true);
    if (garbage.ok) {
      const page = garbage.data as { page: number; limit: number };
      expect(page.page).toBe(1);
      expect(page.limit).toBe(10);
    }
  });

  it('returns an Err result when the repository fails', async () => {
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(Err({ code: 'DB_ERROR', message: 'boom' })) });
    const svc = new MaintenanceService(repo);

    const r = await svc.findAll({});
    expect(r.ok).toBe(false);
  });
});

describe('MaintenanceService.findOne', () => {
  it('returns a mapped row when found', async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(Ok({ id: 7, equipmentName: 'Boiler-1', type: 'corrective', cost: '99' })),
    });
    const svc = new MaintenanceService(repo);

    const r = await svc.findOne(7);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const row = r.data as Record<string, unknown>;
    expect(row.assetName).toBe('Boiler-1');
    expect(row.type).toBe('CORRECTIVE');
    expect(row.cost).toBe(99);
  });

  it('returns an Err result (NOT_FOUND) when the row is missing', async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) });
    const svc = new MaintenanceService(repo);

    const r = await svc.findOne(999);
    expect(r.ok).toBe(false);
  });
});

describe('MaintenanceService.create', () => {
  it('keeps an explicit equipmentName and normalizes the type, forcing status=scheduled', async () => {
    const repo = makeRepo({ create: jest.fn().mockResolvedValue(Ok({ id: 1 })) });
    const svc = new MaintenanceService(repo);

    await svc.create({ equipmentName: 'Extruder-3', type: 'preventive' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ equipmentName: 'Extruder-3', maintenanceType: 'PREVENTIVE', status: 'scheduled' }),
    );
  });

  it('derives equipmentName from assetId when equipmentName is missing', async () => {
    const repo = makeRepo({ create: jest.fn().mockResolvedValue(Ok({ id: 2 })) });
    const svc = new MaintenanceService(repo);

    await svc.create({ assetId: 42 });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ equipmentName: 'Asset #42' }));
  });

  it('falls back to a generic "Equipment" name when neither equipmentName nor assetId is given', async () => {
    const repo = makeRepo({ create: jest.fn().mockResolvedValue(Ok({ id: 3 })) });
    const svc = new MaintenanceService(repo);

    await svc.create({});

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ equipmentName: 'Equipment' }));
  });
});

describe('MaintenanceService.getStats', () => {
  it('buckets rows by status', async () => {
    const rows = [
      { status: 'scheduled' },
      { status: 'scheduled' },
      { status: 'in_progress' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'completed' },
      { status: 'overdue' },
      { status: 'unknown_status' },
    ];
    const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(Ok(rows)) });
    const svc = new MaintenanceService(repo);

    const r = await svc.getStats();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({ total: 8, scheduled: 2, inProgress: 1, completed: 3, overdue: 1 });
  });
});
