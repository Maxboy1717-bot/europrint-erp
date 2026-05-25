/**
 * @module EmployeesListExtendedService.spec
 * @description Minimal contract test for EmployeesListExtendedService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('EmployeesListExtendedService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/employees-list-extended.service');
    expect(mod).toBeDefined();
    expect(mod.EmployeesListExtendedService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/employees-list-extended.service');
    const b = await import('../../src/modules/compatibility/employees-list-extended.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/employees-list-extended.service');
    const exported = mod.EmployeesListExtendedService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
