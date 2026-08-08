import { GofraConversionService } from '../../src/modules/pp/conversion/gofra-conversion.service';
import { OWNER_6_FLUTE_FACTORS } from '../../src/modules/pp/conversion/drizzle-gofra-factors.repo';
import type { FluteFactorConfig } from '../../src/modules/pp/conversion/gofra-conversion.types';

/**
 * Gofra/Sloy 3-FORMULA conversion engine (kg ↔ m² ↔ list/sheet) — vision §29.
 * Pure math, no DB. Known inputs → known outputs for all 3 formulas, round-trips,
 * every owner-#6 flute take-up factor, and divide-by-zero / negative guards.
 */
describe('GofraConversionService (3-formula kg↔m²↔list, vision §29)', () => {
  const svc = new GofraConversionService();
  // Master-data factor config is PASSED IN (never hardcoded in the math).
  const factors: FluteFactorConfig = OWNER_6_FLUTE_FACTORS;

  const ok = <T>(r: { ok: boolean; data?: T; error?: { message: string } }): T => {
    if (!r.ok) throw new Error(`expected Ok, got Err: ${r.error?.message}`);
    return r.data as T;
  };

  // ── FORMULA 1: m² = (W×L / 1e6) × count × waste ───────────────────────────
  describe('Formula 1 — area (m²)', () => {
    it('sheetAreaM2: 1000×700 mm = 0.7 m²', () => {
      expect(ok(svc.sheetAreaM2(1000, 700))).toBeCloseTo(0.7, 6);
    });

    it('wasteFactor: 5% → 1.05, 0%/undefined → 1', () => {
      expect(ok(svc.wasteFactor(5))).toBeCloseTo(1.05, 6);
      expect(ok(svc.wasteFactor(0))).toBe(1);
      expect(ok(svc.wasteFactor())).toBe(1);
    });

    it('sheetsToM2: 1000 sheets × 0.7 m² × 1.05 waste = 735 m²', () => {
      const m2 = ok(svc.sheetsToM2(1000, { sheetWidthMm: 1000, sheetLengthMm: 700, wastePct: 5 }));
      expect(m2).toBeCloseTo(735, 4);
    });

    it('m2ToSheets: reverse 735 m² (5% waste) → 1000 sheets', () => {
      const n = ok(svc.m2ToSheets(735, { sheetWidthMm: 1000, sheetLengthMm: 700, wastePct: 5 }));
      expect(n).toBeCloseTo(1000, 4);
    });
  });

  // ── FORMULA 2: kg = m² × (gsm / 1000) ─────────────────────────────────────
  describe('Formula 2 — mass (kg)', () => {
    it('m2ToKg: 100 m² × 200 GSM = 20 kg', () => {
      expect(ok(svc.m2ToKg(100, 200))).toBeCloseTo(20, 6);
    });

    it('kgToM2: 20 kg / 200 GSM = 100 m²', () => {
      expect(ok(svc.kgToM2(20, 200))).toBeCloseTo(100, 6);
    });
  });

  // ── FORMULA 3: grammage = liner1 + liner2 + (flute × take_up[type]) ────────
  describe('Formula 3 — corrugated grammage', () => {
    it('owner example: 205 + 205 + (127 × 1.43 BC) = 591.61 GSM', () => {
      const g = ok(
        svc.computeCorrugatedGrammage(
          [
            { role: 'liner', gsm: 205 },
            { role: 'liner', gsm: 205 },
            { role: 'flute', gsm: 127, fluteType: 'BC' },
          ],
          factors,
        ),
      );
      expect(g).toBeCloseTo(591.61, 2);
    });

    it('liner is never multiplied by take-up', () => {
      expect(ok(svc.computeCorrugatedGrammage([{ role: 'liner', gsm: 200 }], factors))).toBe(200);
    });

    it.each([
      ['A', 1.54],
      ['B', 1.36],
      ['C', 1.45],
      ['E', 1.27],
      ['BC', 1.43],
    ] as const)('flute %s take-up factor = %f applied to 100 GSM flute', (type, factor) => {
      const g = ok(svc.computeCorrugatedGrammage([{ role: 'flute', gsm: 100, fluteType: type }], factors));
      expect(g).toBeCloseTo(100 * factor, 4);
    });

    it('errors when a flute references an unset take-up factor (e.g. F not in owner-#6)', () => {
      const r = svc.computeCorrugatedGrammage([{ role: 'flute', gsm: 100, fluteType: 'F' }], factors);
      expect(r.ok).toBe(false);
      expect(r.error?.message).toContain("'F'-flute");
    });

    it('errors when a flute layer omits fluteType', () => {
      const r = svc.computeCorrugatedGrammage([{ role: 'flute', gsm: 100 }], factors);
      expect(r.ok).toBe(false);
    });
  });

  // ── ROUND-TRIPS (the "kg ↔ list avtomatik" guarantee) ─────────────────────
  describe('round-trips', () => {
    it('kg → m² → kg returns the original kg', () => {
      const m2 = ok(svc.kgToM2(20, 350));
      const back = ok(svc.m2ToKg(m2, 350));
      expect(back).toBeCloseTo(20, 6);
    });

    it('kg → sheets → kg returns the original kg (with waste applied symmetrically)', () => {
      const spec = { sheetWidthMm: 1000, sheetLengthMm: 700, wastePct: 8 };
      const sheets = ok(svc.kgToSheets(50, 300, spec));
      const back = ok(svc.sheetsToKg(sheets, 300, spec));
      expect(back).toBeCloseTo(50, 4);
    });

    it('sheets → m² → sheets returns the original count', () => {
      const spec = { sheetWidthMm: 1200, sheetLengthMm: 800, wastePct: 3 };
      const m2 = ok(svc.sheetsToM2(250, spec));
      const back = ok(svc.m2ToSheets(m2, spec));
      expect(back).toBeCloseTo(250, 4);
    });

    it('grammage → kg chain: corrugated grammage feeds Formula 2', () => {
      const g = ok(
        svc.computeCorrugatedGrammage(
          [
            { role: 'liner', gsm: 140 },
            { role: 'liner', gsm: 140 },
            { role: 'flute', gsm: 120, fluteType: 'C' },
          ],
          factors,
        ),
      );
      // 140 + 140 + 120×1.45 = 454 GSM
      expect(g).toBeCloseTo(454, 4);
      const kg = ok(svc.m2ToKg(10, g)); // 10 m² × 454/1000
      expect(kg).toBeCloseTo(4.54, 4);
    });
  });

  // ── GUARDS: divide-by-zero / negative → Err, never NaN ────────────────────
  describe('guards (Result.Err, never NaN)', () => {
    it('kgToM2 with zero grammage → Err (no divide-by-zero)', () => {
      const r = svc.kgToM2(10, 0);
      expect(r.ok).toBe(false);
      expect(Number.isNaN(r.data as unknown as number)).toBe(false);
    });

    it('m2ToKg with negative m² → Err', () => {
      expect(svc.m2ToKg(-5, 200).ok).toBe(false);
    });

    it('m2ToSheets with zero sheet size → Err', () => {
      expect(svc.m2ToSheets(100, { sheetWidthMm: 0, sheetLengthMm: 700 }).ok).toBe(false);
    });

    it('sheetsToM2 with negative count → Err', () => {
      expect(svc.sheetsToM2(-10, { sheetWidthMm: 1000, sheetLengthMm: 700 }).ok).toBe(false);
    });

    it('wasteFactor over 100% → Err', () => {
      expect(svc.wasteFactor(150).ok).toBe(false);
    });

    it('NaN / Infinity inputs → Err (never propagates NaN)', () => {
      expect(svc.kgToM2(NaN, 200).ok).toBe(false);
      expect(svc.m2ToKg(Infinity, 200).ok).toBe(false);
      expect(svc.sheetAreaM2(1000, NaN).ok).toBe(false);
    });

    it('resolveTakeUp returns the factor for a configured flute and Err for unset', () => {
      expect(ok(svc.resolveTakeUp('A', factors))).toBeCloseTo(1.54, 4);
      expect(svc.resolveTakeUp('E', { E: null }).ok).toBe(false);
    });
  });
});
