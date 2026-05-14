/**
 * @module EmployeeFilesCompatService.spec
 * @description Minimal contract test for EmployeeFilesCompatService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('EmployeeFilesCompatService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/employee-files-compat.service');
    expect(mod).toBeDefined();
    expect(mod.EmployeeFilesCompatService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/employee-files-compat.service');
    const b = await import('../../src/modules/compatibility/employee-files-compat.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/employee-files-compat.service');
    const exported = mod.EmployeeFilesCompatService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
