/**
 * test/mm/mm-dashboard.service.spec.ts
 *
 * MmDashboardService — thin passthrough over MmDashboardRepository.
 * The runMrp method wraps repo.runMrp output with a timestamp.
 */

import { MmDashboardService } from '../../src/modules/mm/application/mm-dashboard.service';
import { MmDashboardRepository } from '../../src/modules/mm/application/mm-dashboard.repository';

function buildRepo(overrides: Partial<jest.Mocked<MmDashboardRepository>> = {}): jest.Mocked<MmDashboardRepository> {
  return {
    getDashboardStats: jest.fn().mockResolvedValue({ ok: true, data: { pending_po: 5 } }),
    getVendorRatings: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getMrpResults: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    runMrp: jest.fn().mockResolvedValue(7),
    getFleetVehicles: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createFleetVehicle: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    getFuelLogs: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    createFuelLog: jest.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    getSupplierPerformance: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    getPriceHistory: jest.fn().mockResolvedValue({ ok: true, data: [] }),
    ...overrides,
  } as unknown as jest.Mocked<MmDashboardRepository>;
}

describe('MmDashboardService', () => {
  it('getDashboard delegates to repo.getDashboardStats', async () => {
    const repo = buildRepo({
      getDashboardStats: jest.fn().mockResolvedValue({ ok: true, data: { pending_po: 3, approved_po: 8 } }),
    });
    const svc = new MmDashboardService(repo);

    const r = await svc.getDashboard();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ pending_po: 3 });
  });

  it('runMrp augments processed value with a calculated_at timestamp', async () => {
    const repo = buildRepo({
      runMrp: jest.fn().mockResolvedValue({ ok: true, data: 12 }),
    });
    const svc = new MmDashboardService(repo);

    const r = await svc.runMrp();

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const data = r.data as { processed: unknown; calculated_at: Date };
    expect(data.processed).toBeDefined();
    expect(data.calculated_at).toBeInstanceOf(Date);
  });

  it('getMrpResults forwards optional materialId', async () => {
    const repo = buildRepo();
    const svc = new MmDashboardService(repo);

    await svc.getMrpResults(42);

    expect(repo.getMrpResults).toHaveBeenCalledWith(42);
  });

  it('createFuelLog forwards body and userId', async () => {
    const repo = buildRepo();
    const svc = new MmDashboardService(repo);

    await svc.createFuelLog({ liters: 50, cost: 600000 }, 11);

    expect(repo.createFuelLog).toHaveBeenCalledWith({ liters: 50, cost: 600000 }, 11);
  });

  it('getFuelLogs accepts an undefined vehicleId', async () => {
    const repo = buildRepo();
    const svc = new MmDashboardService(repo);

    await svc.getFuelLogs();

    expect(repo.getFuelLogs).toHaveBeenCalledWith(undefined);
  });

  it('getPriceHistory passes material id through', async () => {
    const repo = buildRepo({
      getPriceHistory: jest.fn().mockResolvedValue({ ok: true, data: [{ price: 100 }] }),
    });
    const svc = new MmDashboardService(repo);

    const r = await svc.getPriceHistory(7);

    expect(repo.getPriceHistory).toHaveBeenCalledWith(7);
    expect(r.ok).toBe(true);
  });
});
