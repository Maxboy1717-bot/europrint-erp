/**
 * test/hr/kpi.service.spec.ts
 *
 * Unit tests for KpiService — pure formula composing achievement/quality/OEE
 * into a 0..100 KPI score and a 4-tier rating.
 */

import { KpiService } from '../../src/modules/hr/domain/services/kpi.service';

describe('KpiService', () => {
  const svc = new KpiService();

  describe('calculateKpi()', () => {
    it('returns excellent when all metrics at top', () => {
      const r = svc.calculateKpi({
        employeeId: 1,
        period: new Date('2025-05-01'),
        targetQuantity: 100,
        actualQuantity: 100,
        defectRate: 0,
        oee: 100,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rating).toBe('excellent');
      }
    });

    it('returns poor when metrics are low', () => {
      const r = svc.calculateKpi({
        employeeId: 2,
        period: new Date('2025-05-01'),
        targetQuantity: 100,
        actualQuantity: 30,
        defectRate: 30,
        oee: 30,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.rating).toBe('poor');
      }
    });

    it('overachievement (actual > target) still scores well', () => {
      const r = svc.calculateKpi({
        employeeId: 3,
        period: new Date('2025-05-01'),
        targetQuantity: 100,
        actualQuantity: 120,
        defectRate: 5,
        oee: 90,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(['excellent', 'good']).toContain(r.data.rating);
      }
    });

    it('preserves input fields in output', () => {
      const r = svc.calculateKpi({
        employeeId: 42,
        period: new Date('2025-04-01'),
        targetQuantity: 50,
        actualQuantity: 40,
        defectRate: 10,
        oee: 75,
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.employeeId).toBe(42);
        expect(r.data.targetQuantity).toBe(50);
        expect(r.data.actualQuantity).toBe(40);
      }
    });
  });

  describe('getKpiTrend()', () => {
    it('returns stable when fewer than 2 datapoints', () => {
      const trend = svc.getKpiTrend([{
        employeeId: 1,
        period: new Date('2025-01-01'),
        targetQuantity: 100,
        actualQuantity: 80,
        defectRate: 5,
        oee: 80,
      }]);
      expect(trend).toBe('stable');
    });

    it('detects improving trend when latest > previous by > 5 pts', () => {
      const trend = svc.getKpiTrend([
        { employeeId: 1, period: new Date(), targetQuantity: 100, actualQuantity: 70, defectRate: 5, oee: 80 },
        { employeeId: 1, period: new Date(), targetQuantity: 100, actualQuantity: 90, defectRate: 5, oee: 80 },
      ]);
      expect(trend).toBe('improving');
    });

    it('detects declining trend when latest < previous by < -5 pts', () => {
      const trend = svc.getKpiTrend([
        { employeeId: 1, period: new Date(), targetQuantity: 100, actualQuantity: 90, defectRate: 5, oee: 80 },
        { employeeId: 1, period: new Date(), targetQuantity: 100, actualQuantity: 70, defectRate: 5, oee: 80 },
      ]);
      expect(trend).toBe('declining');
    });

    it('returns stable for small swings within ±5 pts', () => {
      const trend = svc.getKpiTrend([
        { employeeId: 1, period: new Date(), targetQuantity: 100, actualQuantity: 80, defectRate: 5, oee: 80 },
        { employeeId: 1, period: new Date(), targetQuantity: 100, actualQuantity: 82, defectRate: 5, oee: 80 },
      ]);
      expect(trend).toBe('stable');
    });
  });
});
