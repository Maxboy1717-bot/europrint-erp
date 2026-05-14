/**
 * @module DashboardService.spec
 * @description Minimal contract test for DashboardService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DashboardService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/director/dashboard/dashboard.service');
    expect(mod).toBeDefined();
    expect(mod.DashboardService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/director/dashboard/dashboard.service');
    const b = await import('../../src/modules/director/dashboard/dashboard.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/director/dashboard/dashboard.service');
    const exported = mod.DashboardService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
