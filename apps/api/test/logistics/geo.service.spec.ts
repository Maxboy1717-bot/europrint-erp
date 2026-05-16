/**
 * Smoke spec for GeoService (Rule 22: every service needs a unit test).
 *
 * Pure-computation domain service (Haversine + geofence). No DB needed.
 */
import { GeoService } from '../../src/modules/logistics/domain/services/geo.service';

describe('GeoService', () => {
  let svc: GeoService;

  beforeEach(() => {
    svc = new GeoService();
  });

  it('class is defined and constructible', () => {
    expect(GeoService).toBeDefined();
    expect(svc).toBeInstanceOf(GeoService);
  });

  it('haversine returns 0 for identical points', () => {
    const res = svc.haversine(41.3, 69.25, 41.3, 69.25);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toBeCloseTo(0, 6);
  });

  it('haversine rejects out-of-range latitude', () => {
    const res = svc.haversine(91, 0, 0, 0);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('haversine computes ~111 km between two latitudes 1° apart at the same longitude', () => {
    const res = svc.haversine(0, 0, 1, 0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toBeGreaterThan(110);
      expect(res.data).toBeLessThan(112);
    }
  });

  it('isInCircularGeofence rejects negative radius', () => {
    const res = svc.isInCircularGeofence(0, 0, 0, 0, -1);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('isInPolygonGeofence requires at least 3 vertices', () => {
    const res = svc.isInPolygonGeofence(0, 0, [[0, 0], [1, 1]]);
    expect(res.ok).toBe(false);
  });
});
