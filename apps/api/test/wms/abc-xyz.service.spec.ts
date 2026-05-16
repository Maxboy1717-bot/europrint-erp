/**
 * test/wms/abc-xyz.service.spec.ts
 *
 * Unit tests for AbcXyzService — ABC (cumulative value) × XYZ (CV of demand)
 * classification of inventory items. The @Calculation decorator turns
 * `classifyItem` and `analyzeInMemory` into async wrappers; `classifyAbc`
 * and `classifyXyz` are plain helpers and stay sync.
 */

import { AbcXyzService } from '../../src/modules/wms/analytics/abc-xyz.service';

describe('AbcXyzService', () => {
  const svc = new AbcXyzService();

  describe('classifyAbc()', () => {
    it('cumPct ≤ 80 → A', () => {
      expect(svc.classifyAbc(50)).toBe('A');
      expect(svc.classifyAbc(80)).toBe('A');
    });

    it('80 < cumPct ≤ 95 → B', () => {
      expect(svc.classifyAbc(81)).toBe('B');
      expect(svc.classifyAbc(95)).toBe('B');
    });

    it('cumPct > 95 → C', () => {
      expect(svc.classifyAbc(96)).toBe('C');
      expect(svc.classifyAbc(99.9)).toBe('C');
    });
  });

  describe('classifyXyz()', () => {
    it('cv ≤ 0.25 → X (stable demand)', () => {
      expect(svc.classifyXyz(0)).toBe('X');
      expect(svc.classifyXyz(0.25)).toBe('X');
    });

    it('0.25 < cv ≤ 0.50 → Y (moderate)', () => {
      expect(svc.classifyXyz(0.26)).toBe('Y');
      expect(svc.classifyXyz(0.50)).toBe('Y');
    });

    it('cv > 0.50 → Z (volatile)', () => {
      expect(svc.classifyXyz(0.51)).toBe('Z');
      expect(svc.classifyXyz(1.5)).toBe('Z');
    });
  });

  describe('classifyItem()', () => {
    it('combines classes correctly: AX', async () => {
      const r = await svc.classifyItem(50, 0.10);
      expect(r.abcClass).toBe('A');
      expect(r.xyzClass).toBe('X');
      expect(r.abcXyzClass).toBe('AX');
    });

    it('combines classes correctly: BY', async () => {
      const r = await svc.classifyItem(85, 0.40);
      expect(r.abcXyzClass).toBe('BY');
    });

    it('combines classes correctly: CZ', async () => {
      const r = await svc.classifyItem(98, 0.80);
      expect(r.abcXyzClass).toBe('CZ');
    });
  });

  describe('analyzeInMemory()', () => {
    it('returns sorted items and per-class summary counts', async () => {
      const rows = [
        { materialId: 1, annualValue: 1000, demandValues: [10, 10, 10, 10] },
        { materialId: 2, annualValue: 500,  demandValues: [5, 6, 4, 5] },
        { materialId: 3, annualValue: 100,  demandValues: [1, 10, 1, 10] },
      ];

      const r = await svc.analyzeInMemory(rows);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.items).toHaveLength(3);
        // first should be the highest value (1000)
        expect(r.data.items[0].annualValue).toBe(1000);
        // summary keys exist
        const totalClassified = Object.values(r.data.summary).reduce((s, n) => s + n, 0);
        expect(totalClassified).toBe(3);
      }
    });

    it('assigns A class to the highest-value first item', async () => {
      const rows = [
        { materialId: 1, annualValue: 8000, demandValues: [10, 10, 10] },
        { materialId: 2, annualValue: 1000, demandValues: [1, 1, 1] },
        { materialId: 3, annualValue: 1000, demandValues: [1, 1, 1] },
      ];

      const r = await svc.analyzeInMemory(rows);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.items[0].abcClass).toBe('A');
      }
    });

    it('every item carries a non-empty strategy label', async () => {
      const rows = [
        { materialId: 1, annualValue: 100, demandValues: [10, 10, 10] },
      ];

      const r = await svc.analyzeInMemory(rows);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.items[0].strategy).toBeTruthy();
        expect(r.data.items[0].strategy.length).toBeGreaterThan(0);
      }
    });

    it('handles empty input', async () => {
      const r = await svc.analyzeInMemory([]);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.items).toHaveLength(0);
      }
    });
  });
});
