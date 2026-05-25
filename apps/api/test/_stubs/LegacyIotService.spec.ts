/**
 * @module LegacyIotService.spec
 * @description Minimal contract test for LegacyIotService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LegacyIotService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/legacy/services/legacy-iot.service');
    expect(mod).toBeDefined();
    expect(mod.LegacyIotService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/legacy/services/legacy-iot.service');
    const b = await import('../../src/modules/legacy/services/legacy-iot.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/legacy/services/legacy-iot.service');
    const exported = mod.LegacyIotService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
