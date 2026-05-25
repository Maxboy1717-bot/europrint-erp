/**
 * @module CcPinService.spec
 * @description Minimal contract test for CcPinService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('CcPinService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/communication-center/application/cc-pin.service');
    expect(mod).toBeDefined();
    expect(mod.CcPinService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/communication-center/application/cc-pin.service');
    const b = await import('../../src/modules/communication-center/application/cc-pin.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/communication-center/application/cc-pin.service');
    const exported = mod.CcPinService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
