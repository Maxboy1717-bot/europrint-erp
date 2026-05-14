/**
 * @module LegacyService.spec
 * @description Minimal contract test for LegacyService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LegacyService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/legacy/services/legacy.service');
    expect(mod).toBeDefined();
    expect(mod.LegacyService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/legacy/services/legacy.service');
    const b = await import('../../src/modules/legacy/services/legacy.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/legacy/services/legacy.service');
    const exported = mod.LegacyService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
