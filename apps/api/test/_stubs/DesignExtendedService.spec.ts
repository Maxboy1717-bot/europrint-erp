/**
 * @module DesignExtendedService.spec
 * @description Minimal contract test for DesignExtendedService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DesignExtendedService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/design/application/design-extended.service');
    expect(mod).toBeDefined();
    expect(mod.DesignExtendedService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/design/application/design-extended.service');
    const b = await import('../../src/modules/design/application/design-extended.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/design/application/design-extended.service');
    const exported = mod.DesignExtendedService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
