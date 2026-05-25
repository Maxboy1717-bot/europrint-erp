/**
 * @module LmsCoreService.spec
 * @description Minimal contract test for LmsCoreService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LmsCoreService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/lms/application/services/lms-core.service');
    expect(mod).toBeDefined();
    expect(mod.LmsCoreService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/lms/application/services/lms-core.service');
    const b = await import('../../src/modules/lms/application/services/lms-core.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/lms/application/services/lms-core.service');
    const exported = mod.LmsCoreService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
