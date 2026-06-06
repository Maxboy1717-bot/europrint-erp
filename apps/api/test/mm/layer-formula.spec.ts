import { LayerFormulaService } from '../../src/modules/mm/application/layer-formula.service';

/**
 * Layer formula (kg<->sheet) — vision #7. Validates the math against the owner's confirmed examples
 * (476 sheets; 592 GSM). Pure functions only (no DB); convert() is covered by the DB-proof.
 */
describe('LayerFormulaService (kg<->sheet, vision #7)', () => {
  const svc = new LayerFormulaService();

  it('sheetAreaM2: 1000×700 mm = 0.7 m²', () => {
    expect(svc.sheetAreaM2(1000, 700)).toBeCloseTo(0.7, 5);
  });

  it('plainSheetCount: owner example 100kg / 300GSM / 1000×700 → 476 sheets', () => {
    expect(svc.plainSheetCount(100, 300, 1000, 700)).toBeCloseTo(476.19, 1);
  });

  it('plainKg: reverse 476.19 sheets → 100 kg', () => {
    expect(svc.plainKg(476.19, 300, 1000, 700)).toBeCloseTo(100, 1);
  });

  it('corrugatedTotalGsm: owner example 205 + 205 + (127 × 1.43) → 591.61 GSM', () => {
    expect(
      svc.corrugatedTotalGsm([
        { role: 'liner', gsm: 205 },
        { role: 'liner', gsm: 205 },
        { role: 'flute', gsm: 127, takeUpFactor: 1.43 },
      ]),
    ).toBeCloseTo(591.61, 1);
  });

  it('flute take-up defaults to 1 when unset (config not yet filled)', () => {
    expect(svc.corrugatedTotalGsm([{ role: 'flute', gsm: 100 }])).toBe(100);
  });

  it('liner is never multiplied by take-up', () => {
    expect(svc.corrugatedTotalGsm([{ role: 'liner', gsm: 200, takeUpFactor: 1.5 }])).toBe(200);
  });
});
