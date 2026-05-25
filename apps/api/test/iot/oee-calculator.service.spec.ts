/**
 * Smoke spec for OeeCalculatorService (Rule 22: every service needs a unit test).
 *
 * Pure-computation service — no repo or DB dependency.
 */
import { OeeCalculatorService } from '../../src/modules/iot/oee/oee-calculator.service';

describe('OeeCalculatorService', () => {
  let svc: OeeCalculatorService;

  beforeEach(() => {
    svc = new OeeCalculatorService();
  });

  it('class is defined and constructible', () => {
    expect(OeeCalculatorService).toBeDefined();
    expect(svc).toBeInstanceOf(OeeCalculatorService);
  });

  it('rejects negative production time via VALIDATION error', async () => {
    const res = await svc.calculate({
      plannedProductionTime: -10,
      runTime: 100,
      idealCycleTime: 1,
      actualQuantity: 100,
      defectQuantity: 0,
    } as never);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('computes OEE = 100 for a perfect run (RT=PT, AQ*IT=RT, no defects)', async () => {
    const res = await svc.calculate({
      plannedProductionTime: 100,
      runTime: 100,
      idealCycleTime: 1,
      actualQuantity: 100,
      defectQuantity: 0,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Service returns percentage values (0–100), not decimals (0–1)
      expect(res.data.availability).toBe(100);
      expect(res.data.performance).toBe(100);
      expect(res.data.quality).toBe(100);
      expect(res.data.oee).toBe(100);
    }
  });

  it('clamps performance to [0,100] when actual exceeds ideal capacity', async () => {
    const res = await svc.calculate({
      plannedProductionTime: 100,
      runTime: 50,
      idealCycleTime: 2,
      actualQuantity: 100, // 100 * 2 = 200 > 50 RT, must clamp
      defectQuantity: 0,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.performance).toBeLessThanOrEqual(100);
      expect(res.data.performance).toBeGreaterThanOrEqual(0);
    }
  });

  it('quality drops below 100 when defects are present', async () => {
    const res = await svc.calculate({
      plannedProductionTime: 100,
      runTime: 100,
      idealCycleTime: 1,
      actualQuantity: 100,
      defectQuantity: 25,
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.quality).toBeLessThan(100);
  });
});
