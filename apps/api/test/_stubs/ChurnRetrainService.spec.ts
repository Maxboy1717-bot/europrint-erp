/**
 * @module ChurnRetrainService.spec
 * @description Minimal contract test for ChurnRetrainService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('ChurnRetrainService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/crm/analytics/churn-retrain.service');
    expect(mod).toBeDefined();
    expect(mod.ChurnRetrainService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/crm/analytics/churn-retrain.service');
    const b = await import('../../src/modules/crm/analytics/churn-retrain.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/crm/analytics/churn-retrain.service');
    const exported = mod.ChurnRetrainService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
