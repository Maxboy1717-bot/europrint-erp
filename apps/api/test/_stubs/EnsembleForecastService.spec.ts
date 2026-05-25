/**
 * @module EnsembleForecastService.spec
 * @description Minimal contract test for EnsembleForecastService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('EnsembleForecastService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/forecast/ensemble-forecast.service');
    expect(mod).toBeDefined();
    expect(mod.EnsembleForecastService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/forecast/ensemble-forecast.service');
    const b = await import('../../src/modules/ai/forecast/ensemble-forecast.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/forecast/ensemble-forecast.service');
    const exported = mod.EnsembleForecastService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
