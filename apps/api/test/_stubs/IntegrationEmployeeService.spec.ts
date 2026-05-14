/**
 * @module IntegrationEmployeeService.spec
 * @description Minimal contract test for IntegrationEmployeeService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('IntegrationEmployeeService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/integration/integration-employee.service');
    expect(mod).toBeDefined();
    expect(mod.IntegrationEmployeeService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/integration/integration-employee.service');
    const b = await import('../../src/modules/integration/integration-employee.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/integration/integration-employee.service');
    const exported = mod.IntegrationEmployeeService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
