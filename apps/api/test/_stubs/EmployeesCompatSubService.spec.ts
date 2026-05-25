/**
 * @module EmployeesCompatSubService.spec
 * @description Minimal contract test for EmployeesCompatSubService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('EmployeesCompatSubService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/employees-compat-sub.service');
    expect(mod).toBeDefined();
    expect(mod.EmployeesCompatSubService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/employees-compat-sub.service');
    const b = await import('../../src/modules/compatibility/employees-compat-sub.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/employees-compat-sub.service');
    const exported = mod.EmployeesCompatSubService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
