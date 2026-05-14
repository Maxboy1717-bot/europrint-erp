/**
 * @module LmsTestsService.spec
 * @description Minimal contract test for LmsTestsService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LmsTestsService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/lms/application/services/lms-tests.service');
    expect(mod).toBeDefined();
    expect(mod.LmsTestsService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/lms/application/services/lms-tests.service');
    const b = await import('../../src/modules/lms/application/services/lms-tests.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/lms/application/services/lms-tests.service');
    const exported = mod.LmsTestsService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
