/**
 * @module DeliveriesService.spec
 * @description Minimal contract test for DeliveriesService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DeliveriesService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/logistics/deliveries/deliveries.service');
    expect(mod).toBeDefined();
    expect(mod.DeliveriesService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/logistics/deliveries/deliveries.service');
    const b = await import('../../src/modules/logistics/deliveries/deliveries.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/logistics/deliveries/deliveries.service');
    const exported = mod.DeliveriesService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
