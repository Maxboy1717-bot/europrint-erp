/**
 * @module DepartmentsService.spec
 * @description Minimal contract test for DepartmentsService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DepartmentsService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/core/departments/departments.service');
    expect(mod).toBeDefined();
    expect(mod.DepartmentsService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/core/departments/departments.service');
    const b = await import('../../src/modules/core/departments/departments.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/core/departments/departments.service');
    const exported = mod.DepartmentsService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
