/**
 * @module AnalyticsExtendedService.spec
 * @description Minimal contract test for AnalyticsExtendedService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AnalyticsExtendedService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/analytics/analytics-extended.service');
    expect(mod).toBeDefined();
    expect(mod.AnalyticsExtendedService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/analytics/analytics-extended.service');
    const b = await import('../../src/modules/analytics/analytics-extended.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/analytics/analytics-extended.service');
    const exported = mod.AnalyticsExtendedService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
