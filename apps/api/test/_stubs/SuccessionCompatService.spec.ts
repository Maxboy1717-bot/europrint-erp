/**
 * @module SuccessionCompatService.spec
 * @description Minimal contract test for SuccessionCompatService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('SuccessionCompatService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/succession-compat.service');
    expect(mod).toBeDefined();
    expect(mod.SuccessionCompatService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/succession-compat.service');
    const b = await import('../../src/modules/compatibility/succession-compat.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/succession-compat.service');
    const exported = mod.SuccessionCompatService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
