/**
 * @file wms-roll-calc.spec.ts
 * @description WmsRollCalcService — unit testlar.
 *
 * Test tuzilmasi:
 *   1. estimatedLengthM — qo'lda hisoblangan misol bilan tasdiq
 *   2. remainingWeightKg — round-trip (uzunlik → og'irlik → uzunlik)
 *   3. rollAreaM2 — og'irlikdan va uzunlikdan hisoblash
 *   4. Guard testlar — nol/manfiy/NaN/Infinity → Err
 *
 * Sof (pure) xizmat — mock kerak emas, to'g'ridan `new WmsRollCalcService()` ishlatiladi.
 *
 * Qo'lda hisoblangan misol (EP-WMS-032 rulon karta tasdiqi):
 *   Rulon: 100 kg, 120 g/m², 1000 mm kenglik
 *   length_m = 100 × 1_000_000 / (120 × 1000) = 100_000_000 / 120_000 = 833.333... m
 *   area_m2  = 100 × 1000 / 120 = 833.333... m²
 *   weight back = 833.333 × 120 × 1000 / 1_000_000 = 99_999.96 / 1000 = 99.9996 ≈ 100 kg
 */

// Shared DB stub — WmsRollCalcService DB ishlatmaydi lekin boshqa import'lar
// (masalan, @common/result) shared/db ni reference qilishi mumkin.
jest.mock('../src/shared/db', () => ({
  db: {},
  runQuery: jest.fn(),
}));

import { WmsRollCalcService } from '../src/modules/wms/domain/services/wms-roll-calc.service';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures — qo'lda hisoblangan etalon qiymatlar
// ─────────────────────────────────────────────────────────────────────────────

/** Etalon misol: 100 kg, 120 gsm, 1000 mm */
const CASE_A = {
  weightKg: 100,
  grammageGsm: 120,
  widthMm: 1000,
  // length_m = 100 × 1_000_000 / (120 × 1000) = 833.333...
  // roundTo(833.333..., 3) = 833.333
  expectedLengthM: 833.333,
  // area_m2 = 100 × 1000 / 120 = 833.333...
  // roundTo(833.333..., 4) = 833.3333
  expectedAreaM2: 833.3333,
};

/** Etalon misol B: 50 kg, 80 gsm, 800 mm */
const CASE_B = {
  weightKg: 50,
  grammageGsm: 80,
  widthMm: 800,
  // length_m = 50 × 1_000_000 / (80 × 800) = 50_000_000 / 64_000 = 781.25 m
  expectedLengthM: 781.25,
  // area_m2 = 50 × 1000 / 80 = 625 m²
  expectedAreaM2: 625.0,
};

/** Etalon misol C: engil rulon — 0.5 kg, 40 gsm, 100 mm */
const CASE_C = {
  weightKg: 0.5,
  grammageGsm: 40,
  widthMm: 100,
  // length_m = 0.5 × 1_000_000 / (40 × 100) = 500_000 / 4_000 = 125 m
  expectedLengthM: 125,
  // area_m2 = 0.5 × 1000 / 40 = 12.5 m²
  expectedAreaM2: 12.5,
};

// ─────────────────────────────────────────────────────────────────────────────

describe('WmsRollCalcService', () => {
  let svc: WmsRollCalcService;

  beforeEach(() => {
    svc = new WmsRollCalcService();
  });

  // ── 1. estimatedLengthM ────────────────────────────────────────────────────

  describe('estimatedLengthM', () => {
    it('CASE_A: 100kg / 120gsm / 1000mm → 833.333 m (qo\'lda hisob bilan mos)', () => {
      const result = svc.estimatedLengthM(CASE_A.weightKg, CASE_A.grammageGsm, CASE_A.widthMm);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toBeCloseTo(CASE_A.expectedLengthM, 2);
    });

    it('CASE_B: 50kg / 80gsm / 800mm → 781.25 m', () => {
      const result = svc.estimatedLengthM(CASE_B.weightKg, CASE_B.grammageGsm, CASE_B.widthMm);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toBeCloseTo(CASE_B.expectedLengthM, 2);
    });

    it('CASE_C: engil rulon 0.5kg / 40gsm / 100mm → 125 m', () => {
      const result = svc.estimatedLengthM(CASE_C.weightKg, CASE_C.grammageGsm, CASE_C.widthMm);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toBeCloseTo(CASE_C.expectedLengthM, 2);
    });

    it('natija musbat bo\'lishi kerak', () => {
      const result = svc.estimatedLengthM(10, 60, 500);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toBeGreaterThan(0);
    });

    it('yaxlitlash: chiqish 3 xonadan oshmasligi kerak', () => {
      // 1/3 = 0.333... → roundTo(_, 3) = 0.333
      const result = svc.estimatedLengthM(1, 3, 1_000_000);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const str = result.data.toString();
      const decimals = str.includes('.') ? str.split('.')[1]?.length ?? 0 : 0;
      expect(decimals).toBeLessThanOrEqual(3);
    });
  });

  // ── 2. remainingWeightKg — round-trip ──────────────────────────────────────

  describe('remainingWeightKg (round-trip)', () => {
    it('CASE_A: uzunlik → og\'irlik round-trip ≈ asl og\'irlik (±0.01 kg)', () => {
      const lenResult = svc.estimatedLengthM(CASE_A.weightKg, CASE_A.grammageGsm, CASE_A.widthMm);
      expect(lenResult.ok).toBe(true);
      if (!lenResult.ok) return;

      const wResult = svc.remainingWeightKg(lenResult.data, CASE_A.grammageGsm, CASE_A.widthMm);
      expect(wResult.ok).toBe(true);
      if (!wResult.ok) return;

      // Round-trip: 100 kg → 833.333 m → 99.9996 kg ≈ 100 kg (yaxlitlash ta'siri)
      expect(wResult.data).toBeCloseTo(CASE_A.weightKg, 1);
    });

    it('CASE_B: round-trip 50 kg → uzunlik → og\'irlik ≈ 50 kg', () => {
      const lenResult = svc.estimatedLengthM(CASE_B.weightKg, CASE_B.grammageGsm, CASE_B.widthMm);
      expect(lenResult.ok).toBe(true);
      if (!lenResult.ok) return;

      const wResult = svc.remainingWeightKg(lenResult.data, CASE_B.grammageGsm, CASE_B.widthMm);
      expect(wResult.ok).toBe(true);
      if (!wResult.ok) return;

      expect(wResult.data).toBeCloseTo(CASE_B.weightKg, 1);
    });

    it('CASE_C: round-trip 0.5 kg → uzunlik → og\'irlik ≈ 0.5 kg', () => {
      const lenResult = svc.estimatedLengthM(CASE_C.weightKg, CASE_C.grammageGsm, CASE_C.widthMm);
      expect(lenResult.ok).toBe(true);
      if (!lenResult.ok) return;

      const wResult = svc.remainingWeightKg(lenResult.data, CASE_C.grammageGsm, CASE_C.widthMm);
      expect(wResult.ok).toBe(true);
      if (!wResult.ok) return;

      expect(wResult.data).toBeCloseTo(CASE_C.weightKg, 2);
    });

    it('to\'g\'ridan: 833.333 m / 120 gsm / 1000 mm → ~100 kg', () => {
      const result = svc.remainingWeightKg(833.333, 120, 1000);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // 833.333 × 120 × 1000 / 1_000_000 = 99_999.96 / 1000 = 99.9996
      expect(result.data).toBeCloseTo(100, 1);
    });

    it('natija musbat bo\'lishi kerak', () => {
      const result = svc.remainingWeightKg(200, 80, 1200);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toBeGreaterThan(0);
    });
  });

  // ── 3. rollAreaM2 ──────────────────────────────────────────────────────────

  describe('rollAreaM2', () => {
    describe('og\'irlikdan hisoblash (weightKg + grammageGsm)', () => {
      it('CASE_A: 100 kg, 120 gsm → 833.3333 m²', () => {
        const result = svc.rollAreaM2({ weightKg: CASE_A.weightKg, grammageGsm: CASE_A.grammageGsm });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.data).toBeCloseTo(CASE_A.expectedAreaM2, 2);
      });

      it('CASE_B: 50 kg, 80 gsm → 625 m²', () => {
        const result = svc.rollAreaM2({ weightKg: CASE_B.weightKg, grammageGsm: CASE_B.grammageGsm });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.data).toBeCloseTo(CASE_B.expectedAreaM2, 2);
      });

      it('CASE_C: 0.5 kg, 40 gsm → 12.5 m²', () => {
        const result = svc.rollAreaM2({ weightKg: CASE_C.weightKg, grammageGsm: CASE_C.grammageGsm });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.data).toBeCloseTo(CASE_C.expectedAreaM2, 2);
      });
    });

    describe('uzunlikdan hisoblash (lengthM + widthMm)', () => {
      it('CASE_A: 833.333 m, 1000 mm → 833.333 m²', () => {
        const result = svc.rollAreaM2({ lengthM: CASE_A.expectedLengthM, widthMm: CASE_A.widthMm });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        // 833.333 × 1000 / 1000 = 833.333
        expect(result.data).toBeCloseTo(CASE_A.expectedAreaM2, 1);
      });

      it('CASE_B: 781.25 m, 800 mm → 625 m²', () => {
        const result = svc.rollAreaM2({ lengthM: CASE_B.expectedLengthM, widthMm: CASE_B.widthMm });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        // 781.25 × 800 / 1000 = 625
        expect(result.data).toBeCloseTo(CASE_B.expectedAreaM2, 2);
      });
    });

    it('ikki yo\'l ham bir xil natija beradi (matematik ekvivalent)', () => {
      const fromWeight = svc.rollAreaM2({
        weightKg: CASE_A.weightKg,
        grammageGsm: CASE_A.grammageGsm,
      });
      const fromLength = svc.rollAreaM2({
        lengthM: CASE_A.expectedLengthM,
        widthMm: CASE_A.widthMm,
      });
      expect(fromWeight.ok).toBe(true);
      expect(fromLength.ok).toBe(true);
      if (!fromWeight.ok || !fromLength.ok) return;
      // Yaxlitlash tafovuti tufayli 1 xona aniqlikda tekshiramiz
      expect(fromWeight.data).toBeCloseTo(fromLength.data, 0);
    });

    it('hech qanday parametr berilmasa → Err(VALIDATION)', () => {
      const result = svc.rollAreaM2({});
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('weightKg bor lekin grammageGsm yo\'q → og\'irlikdan yo\'l ishlamaydi, Err', () => {
      // weightKg bor, grammageGsm yo'q, lengthM va widthMm ham yo'q → Err
      const result = svc.rollAreaM2({ weightKg: 10 });
      expect(result.ok).toBe(false);
    });
  });

  // ── 4. Guard testlar — nol / manfiy / NaN / Infinity ──────────────────────

  describe('Guard: nol va manfiy kirish → Err(VALIDATION)', () => {
    // estimatedLengthM
    it('estimatedLengthM: grammageGsm = 0 → Err', () => {
      const result = svc.estimatedLengthM(100, 0, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: grammageGsm < 0 → Err', () => {
      const result = svc.estimatedLengthM(100, -80, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: widthMm = 0 → Err', () => {
      const result = svc.estimatedLengthM(100, 120, 0);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: widthMm < 0 → Err', () => {
      const result = svc.estimatedLengthM(100, 120, -500);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: weightKg = 0 → Err', () => {
      const result = svc.estimatedLengthM(0, 120, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: weightKg < 0 → Err', () => {
      const result = svc.estimatedLengthM(-10, 120, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: weightKg = NaN → Err', () => {
      const result = svc.estimatedLengthM(NaN, 120, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: grammageGsm = Infinity → Err', () => {
      const result = svc.estimatedLengthM(100, Infinity, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('estimatedLengthM: widthMm = -Infinity → Err', () => {
      const result = svc.estimatedLengthM(100, 120, -Infinity);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    // remainingWeightKg
    it('remainingWeightKg: currentLengthM = 0 → Err', () => {
      const result = svc.remainingWeightKg(0, 120, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('remainingWeightKg: grammageGsm = 0 → Err', () => {
      const result = svc.remainingWeightKg(100, 0, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('remainingWeightKg: widthMm = 0 → Err', () => {
      const result = svc.remainingWeightKg(100, 120, 0);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    it('remainingWeightKg: NaN kirish → Err', () => {
      const result = svc.remainingWeightKg(NaN, 120, 1000);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION');
    });

    // rollAreaM2 guard
    it('rollAreaM2(weightKg=0): → Err', () => {
      const result = svc.rollAreaM2({ weightKg: 0, grammageGsm: 120 });
      expect(result.ok).toBe(false);
    });

    it('rollAreaM2(grammageGsm=0): → Err', () => {
      const result = svc.rollAreaM2({ weightKg: 100, grammageGsm: 0 });
      expect(result.ok).toBe(false);
    });

    it('rollAreaM2(lengthM=-1): → Err', () => {
      const result = svc.rollAreaM2({ lengthM: -1, widthMm: 1000 });
      expect(result.ok).toBe(false);
    });

    it('rollAreaM2(widthMm=NaN): → Err', () => {
      const result = svc.rollAreaM2({ lengthM: 100, widthMm: NaN });
      expect(result.ok).toBe(false);
    });
  });

  // ── 5. Qo'shimcha hisob aniqligi testlar ───────────────────────────────────

  describe('Hisob aniqligi va chegaraviy qiymatlar', () => {
    it('katta rulon: 5000 kg, 120 gsm, 2800 mm → >0', () => {
      const result = svc.estimatedLengthM(5000, 120, 2800);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // 5000 × 1_000_000 / (120 × 2800) = 5_000_000_000 / 336_000 ≈ 14880.952
      expect(result.data).toBeGreaterThan(14000);
      expect(result.data).toBeLessThan(16000);
    });

    it('engil rulon: 0.001 kg, 40 gsm, 100 mm → musbat natija', () => {
      const result = svc.estimatedLengthM(0.001, 40, 100);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // 0.001 × 1_000_000 / (40 × 100) = 1000 / 4000 = 0.25 m
      expect(result.data).toBeCloseTo(0.25, 2);
    });

    it('yuqori gramaj: 500 gsm (qalin karton), hisoblash to\'g\'ri', () => {
      const result = svc.estimatedLengthM(100, 500, 1000);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // 100 × 1_000_000 / (500 × 1000) = 100_000_000 / 500_000 = 200 m
      expect(result.data).toBeCloseTo(200, 2);
    });

    it('bir xil GSM va kenglikda 2x og\'irlik → 2x uzunlik (proporsional)', () => {
      const r1 = svc.estimatedLengthM(100, 120, 1000);
      const r2 = svc.estimatedLengthM(200, 120, 1000);
      expect(r1.ok && r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;
      expect(r2.data).toBeCloseTo(r1.data * 2, 1);
    });

    it('2x kenglikda bir xil og\'irlik → 0.5x uzunlik (teskari proporsional)', () => {
      const r1 = svc.estimatedLengthM(100, 120, 1000);
      const r2 = svc.estimatedLengthM(100, 120, 2000);
      expect(r1.ok && r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;
      expect(r2.data).toBeCloseTo(r1.data / 2, 1);
    });
  });
});
