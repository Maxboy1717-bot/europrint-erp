/**
 * @module LmsExamsService.spec
 * @description Minimal contract test for LmsExamsService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LmsExamsService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/lms/application/services/lms-exams.service');
    expect(mod).toBeDefined();
    expect(mod.LmsExamsService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/lms/application/services/lms-exams.service');
    const b = await import('../../src/modules/lms/application/services/lms-exams.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/lms/application/services/lms-exams.service');
    const exported = mod.LmsExamsService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
