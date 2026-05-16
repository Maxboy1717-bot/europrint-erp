/**
 * Smoke spec for VrpService (Rule 22: every service needs a unit test).
 *
 * Pure-computation domain service (Clarke-Wright + 2-opt). It depends only on
 * GeoService — also a pure-compute class.
 */
import { VrpService } from '../../src/modules/logistics/domain/services/vrp.service';
import { GeoService } from '../../src/modules/logistics/domain/services/geo.service';

describe('VrpService', () => {
  let svc: VrpService;

  beforeEach(() => {
    svc = new VrpService(new GeoService());
  });

  it('class is defined and constructible with GeoService', () => {
    expect(VrpService).toBeDefined();
    expect(svc).toBeInstanceOf(VrpService);
  });

  it('optimizeRoutes returns empty plan when there are no deliveries', async () => {
    const res = await svc.optimizeRoutes({ lat: 41.3, lon: 69.25 }, [], [{ id: 'v1', capacity: 100 }]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.routes).toEqual([]);
      expect(res.data.totalDistance).toBe(0);
    }
  });

  it('optimizeRoutes returns BAD_REQUEST when there are deliveries but no vehicles', async () => {
    const res = await svc.optimizeRoutes(
      { lat: 41.3, lon: 69.25 },
      [{ id: 'd1', lat: 41.31, lon: 69.26, weight: 5 }],
      [],
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('BAD_REQUEST');
  });

  it('optimizeRoutes produces a non-zero plan for a small delivery set', async () => {
    const res = await svc.optimizeRoutes(
      { lat: 41.3, lon: 69.25 },
      [
        { id: 'd1', lat: 41.31, lon: 69.26, weight: 10 },
        { id: 'd2', lat: 41.32, lon: 69.27, weight: 15 },
      ],
      [{ id: 'v1', capacity: 100 }],
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.routes.length).toBeGreaterThan(0);
      expect(res.data.totalDistance).toBeGreaterThan(0);
    }
  });

  it('optimizeRoutes respects vehicle capacity (creates separate routes)', async () => {
    const res = await svc.optimizeRoutes(
      { lat: 41.3, lon: 69.25 },
      [
        { id: 'd1', lat: 41.31, lon: 69.26, weight: 60 },
        { id: 'd2', lat: 41.32, lon: 69.27, weight: 60 },
      ],
      [{ id: 'v1', capacity: 80 }],
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Each delivery must be on its own route — combined load 120 > capacity 80.
      expect(res.data.routes.length).toBeGreaterThanOrEqual(2);
    }
  });
});
