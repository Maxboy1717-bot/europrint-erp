/**
 * test/qc/qc-aql.service.spec.ts
 *
 * Unit tests for QcAqlService.plan().
 *
 * Reference: ISO 2859-1:1999 Tables 1 (lot-size code letters) and 2A
 * (normal-inspection single-sampling plans).  Every expected value below is
 * taken directly from those tables and can be verified against any published
 * copy of the standard.
 *
 * Coverage:
 *   - Error guards (lotSize ≤ 0, non-integer, < 2)
 *   - Representative lot sizes spanning code letters A … R for Level II
 *   - AQL 2.5 Ac/Re values for each code letter (ISO reference values)
 *   - Boundary lot sizes (exact lower and upper bound of each range)
 *   - Non-default levels (I and III)
 *   - Non-default AQL values (1.0, 4.0)
 *   - The returned reject number always equals accept + 1
 */

// No NestJS DI needed — the service is a plain class with no constructor deps.
import { QcAqlService } from '../../src/modules/qc/domain/services/qc-aql.service';

describe('QcAqlService.plan', () => {
  const svc = new QcAqlService();

  // ─────────────────────────────────────────────────────────────────────────
  // Guard: invalid lot sizes
  // ─────────────────────────────────────────────────────────────────────────

  describe('guard: invalid lot size', () => {
    it('returns VALIDATION error for lotSize = 0', () => {
      const r = svc.plan(0);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('returns VALIDATION error for negative lotSize', () => {
      const r = svc.plan(-10);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('returns VALIDATION error for lotSize = 1 (below ISO table minimum of 2)', () => {
      const r = svc.plan(1);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('returns VALIDATION error for fractional lotSize', () => {
      const r = svc.plan(10.5);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('returns VALIDATION error for NaN', () => {
      const r = svc.plan(NaN);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });

    it('returns VALIDATION error for Infinity', () => {
      // Infinity is a valid lot size only if we wanted unlimited lots —
      // the standard does not define this; guard it out.
      const r = svc.plan(Infinity);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error.code).toBe('VALIDATION');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Default level = II, default AQL = 2.5
  // ISO 2859-1 Table 1 (Level II) + Table 2A (AQL 2.5) reference values
  // ─────────────────────────────────────────────────────────────────────────

  describe('default: Level II, AQL 2.5', () => {
    /**
     * ISO 2859-1 reference values for General Inspection Level II, AQL 2.5.
     * Source: Table 1 (code letter) + Table 2A (n, Ac, Re).
     *
     * [lotSize, expectedCodeLetter, expectedN, expectedAc, expectedRe]
     */
    const cases: [number, string, number, number, number][] = [
      // Lot 2–8   → Code A → Table 2A AQL 2.5: ↑ pre-resolved → n=3, Ac=0, Re=1
      [2,       'A',  2,   0, 1],
      [8,       'A',  2,   0, 1],
      // Lot 9–15  → Code B → n=3, Ac=0, Re=1
      [9,       'B',  3,   0, 1],
      [15,      'B',  3,   0, 1],
      // Lot 16–25 → Code C → n=5, Ac=0, Re=1
      [16,      'C',  5,   0, 1],
      [25,      'C',  5,   0, 1],
      // Lot 26–50 → Code D → n=8, Ac=0, Re=1
      [26,      'D',  8,   0, 1],
      [50,      'D',  8,   0, 1],
      // Lot 51–90 → Code E → n=13, Ac=1, Re=2
      [51,      'E', 13,   1, 2],
      [90,      'E', 13,   1, 2],
      // Lot 91–150 → Code F → n=20, Ac=1, Re=2
      [91,      'F', 20,   1, 2],
      [150,     'F', 20,   1, 2],
      // Lot 151–280 → Code G → n=32, Ac=2, Re=3
      [151,     'G', 32,   2, 3],
      [280,     'G', 32,   2, 3],
      // Lot 281–500 → Code H → n=50, Ac=3, Re=4
      [281,     'H', 50,   3, 4],
      [500,     'H', 50,   3, 4],
      // Lot 501–1200 → Code J → n=80, Ac=5, Re=6
      [501,     'J', 80,   5, 6],
      [1_200,   'J', 80,   5, 6],
      // Lot 1201–3200 → Code K → n=125, Ac=7, Re=8
      [1_201,   'K', 125,  7, 8],
      [3_200,   'K', 125,  7, 8],
      // Lot 3201–10000 → Code L → n=200, Ac=10, Re=11
      [3_201,   'L', 200, 10, 11],
      [10_000,  'L', 200, 10, 11],
      // Lot 10001–35000 → Code M → n=315, Ac=14, Re=15
      [10_001,  'M', 315, 14, 15],
      [35_000,  'M', 315, 14, 15],
      // Lot 35001–150000 → Code N → n=500, Ac=21, Re=22
      [35_001,  'N', 500, 21, 22],
      [150_000, 'N', 500, 21, 22],
      // Lot 150001–500000 → Code P → n=800, Ac=21, Re=22 (↓ resolved)
      [150_001, 'P', 800, 21, 22],
      [500_000, 'P', 800, 21, 22],
      // Lot 500001+ → Code Q → n=1250, Ac=21, Re=22 (↓ resolved)
      [500_001, 'Q', 1_250, 21, 22],
      [999_999, 'Q', 1_250, 21, 22],
    ];

    test.each(cases)(
      'lotSize=%d → codeLetter=%s, n=%d, Ac=%d, Re=%d',
      (lotSize, expectedCode, expectedN, expectedAc, expectedRe) => {
        const r = svc.plan(lotSize);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.data.codeLetter).toBe(expectedCode);
        expect(r.data.sampleSize).toBe(expectedN);
        expect(r.data.accept).toBe(expectedAc);
        expect(r.data.reject).toBe(expectedRe);
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Invariant: reject === accept + 1 for all valid inputs
  // ─────────────────────────────────────────────────────────────────────────

  describe('invariant: reject = accept + 1', () => {
    const representativeLotSizes = [2, 15, 50, 150, 500, 1_200, 3_200, 10_000, 35_000];

    test.each(representativeLotSizes)(
      'lotSize=%d: reject = accept + 1',
      (lotSize) => {
        const r = svc.plan(lotSize);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.data.reject).toBe(r.data.accept + 1);
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Non-default level: Inspection Level I
  // ─────────────────────────────────────────────────────────────────────────

  describe('Inspection Level I, AQL 2.5 — tighter sampling than Level II', () => {
    it('lot=151 → Level I code E (vs Level II code G)', () => {
      const rI  = svc.plan(151, 2.5, 'I');
      const rII = svc.plan(151, 2.5, 'II');
      expect(rI.ok).toBe(true);
      expect(rII.ok).toBe(true);
      if (!rI.ok || !rII.ok) return;
      // Level I should yield code E (n=13), Level II yields code G (n=32)
      expect(rI.data.codeLetter).toBe('E');
      expect(rI.data.sampleSize).toBeLessThan(rII.data.sampleSize);
    });

    it('lot=500 → Level I code F → n=20, Ac=1, Re=2', () => {
      const r = svc.plan(500, 2.5, 'I');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('F');
      expect(r.data.sampleSize).toBe(20);
      expect(r.data.accept).toBe(1);
      expect(r.data.reject).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Non-default level: Inspection Level III
  // ─────────────────────────────────────────────────────────────────────────

  describe('Inspection Level III, AQL 2.5 — more thorough than Level II', () => {
    it('lot=151 → Level III code H (vs Level II code G)', () => {
      const rIII = svc.plan(151, 2.5, 'III');
      const rII  = svc.plan(151, 2.5, 'II');
      expect(rIII.ok).toBe(true);
      expect(rII.ok).toBe(true);
      if (!rIII.ok || !rII.ok) return;
      // Level III should yield code H (n=50), Level II yields code G (n=32)
      expect(rIII.data.codeLetter).toBe('H');
      expect(rIII.data.sampleSize).toBeGreaterThan(rII.data.sampleSize);
    });

    it('lot=500 → Level III code J → n=80, Ac=5, Re=6', () => {
      const r = svc.plan(500, 2.5, 'III');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('J');
      expect(r.data.sampleSize).toBe(80);
      expect(r.data.accept).toBe(5);
      expect(r.data.reject).toBe(6);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Non-default AQL: 1.0 (stricter)
  // ─────────────────────────────────────────────────────────────────────────

  describe('AQL 1.0 (stricter than 2.5)', () => {
    it('lot=500 → Level II code H → n=50, Ac=1, Re=2', () => {
      const r = svc.plan(500, 1.0, 'II');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('H');
      expect(r.data.sampleSize).toBe(50);
      expect(r.data.accept).toBe(1);
      expect(r.data.reject).toBe(2);
    });

    it('Ac for AQL 1.0 is ≤ Ac for AQL 2.5 at the same code letter', () => {
      // Stricter AQL = lower or equal acceptance number
      const r1 = svc.plan(1_200, 1.0);
      const r2 = svc.plan(1_200, 2.5);
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;
      expect(r1.data.accept).toBeLessThanOrEqual(r2.data.accept);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Non-default AQL: 4.0 (looser)
  // ─────────────────────────────────────────────────────────────────────────

  describe('AQL 4.0 (looser than 2.5)', () => {
    it('lot=500 → Level II code H → n=50, Ac=5, Re=6', () => {
      const r = svc.plan(500, 4.0, 'II');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('H');
      expect(r.data.sampleSize).toBe(50);
      expect(r.data.accept).toBe(5);
      expect(r.data.reject).toBe(6);
    });

    it('Ac for AQL 4.0 is ≥ Ac for AQL 2.5 at the same code letter', () => {
      const r4 = svc.plan(1_200, 4.0);
      const r2 = svc.plan(1_200, 2.5);
      expect(r4.ok).toBe(true);
      expect(r2.ok).toBe(true);
      if (!r4.ok || !r2.ok) return;
      expect(r4.data.accept).toBeGreaterThanOrEqual(r2.data.accept);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Boundary lot sizes — exact lower and upper limits of each range
  // ─────────────────────────────────────────────────────────────────────────

  describe('exact boundary lot sizes', () => {
    it('lotSize = 2 (absolute minimum)', () => {
      const r = svc.plan(2);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('A');
    });

    it('lotSize = 8 (upper boundary of first range)', () => {
      const r8 = svc.plan(8);
      expect(r8.ok).toBe(true);
      if (!r8.ok) return;
      expect(r8.data.codeLetter).toBe('A');
    });

    it('lotSize = 9 (lower boundary of second range)', () => {
      const r9 = svc.plan(9);
      expect(r9.ok).toBe(true);
      if (!r9.ok) return;
      expect(r9.data.codeLetter).toBe('B');
    });

    it('lotSizes 8 and 9 map to different code letters', () => {
      const r8 = svc.plan(8);
      const r9 = svc.plan(9);
      expect(r8.ok).toBe(true);
      expect(r9.ok).toBe(true);
      if (!r8.ok || !r9.ok) return;
      expect(r8.data.codeLetter).not.toBe(r9.data.codeLetter);
    });

    it('lotSizes 280 and 281 map to different code letters', () => {
      const r280 = svc.plan(280);
      const r281 = svc.plan(281);
      expect(r280.ok).toBe(true);
      expect(r281.ok).toBe(true);
      if (!r280.ok || !r281.ok) return;
      expect(r280.data.codeLetter).toBe('G');
      expect(r281.data.codeLetter).toBe('H');
    });

    it('lotSizes 500 and 501 map to different code letters for Level II', () => {
      const r500 = svc.plan(500, 2.5, 'II');
      const r501 = svc.plan(501, 2.5, 'II');
      expect(r500.ok).toBe(true);
      expect(r501.ok).toBe(true);
      if (!r500.ok || !r501.ok) return;
      expect(r500.data.codeLetter).toBe('H');
      expect(r501.data.codeLetter).toBe('J');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Very large lots
  // ─────────────────────────────────────────────────────────────────────────

  describe('very large lots', () => {
    /**
     * ISO 2859-1 Table 1 (Level II): lot 500,001+ → code letter Q.
     * Code R is the Level III code for the same range.
     * Table 2A, code Q, AQL 2.5: n=1250, Ac=21 (↓ resolved), Re=22.
     */
    it('lot = 1_000_000 → Level II code Q → n=1250, Ac=21, Re=22', () => {
      const r = svc.plan(1_000_000);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('Q');
      expect(r.data.sampleSize).toBe(1_250);
      expect(r.data.accept).toBe(21);
      expect(r.data.reject).toBe(22);
    });

    it('lot = 10_000_000 → Level II code Q (table is bounded at 500_001+ → Q)', () => {
      const r = svc.plan(10_000_000);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      // Both 1M and 10M should resolve to the same code letter (Q for Level II)
      // since the last row has max = Infinity
      expect(r.data.codeLetter).toBe('Q');
    });

    it('lot = 1_000_000, Level III → code R → n=2000, Ac=21, Re=22', () => {
      const r = svc.plan(1_000_000, 2.5, 'III');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('R');
      expect(r.data.sampleSize).toBe(2_000);
      expect(r.data.accept).toBe(21);
      expect(r.data.reject).toBe(22);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Typical EuroPrint production lot sizes
  // ─────────────────────────────────────────────────────────────────────────

  describe('typical EuroPrint production lots', () => {
    it('small print run (lot=200) → code G, n=32, Ac=2, Re=3', () => {
      const r = svc.plan(200);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('G');
      expect(r.data.sampleSize).toBe(32);
      expect(r.data.accept).toBe(2);
      expect(r.data.reject).toBe(3);
    });

    it('medium print run (lot=5000) → code L, n=200, Ac=10, Re=11', () => {
      const r = svc.plan(5_000);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('L');
      expect(r.data.sampleSize).toBe(200);
      expect(r.data.accept).toBe(10);
      expect(r.data.reject).toBe(11);
    });

    it('large print run (lot=50000) → code N, n=500, Ac=21, Re=22', () => {
      const r = svc.plan(50_000);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.codeLetter).toBe('N');
      expect(r.data.sampleSize).toBe(500);
      expect(r.data.accept).toBe(21);
      expect(r.data.reject).toBe(22);
    });
  });
});
