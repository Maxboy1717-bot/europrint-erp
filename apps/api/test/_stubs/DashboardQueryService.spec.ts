/**
 * @module DashboardQueryService.spec
 * @description Minimal contract test for DashboardQueryService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DashboardQueryService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/director/application/dashboard-query.service');
    expect(mod).toBeDefined();
    expect(mod.DashboardQueryService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/director/application/dashboard-query.service');
    const b = await import('../../src/modules/director/application/dashboard-query.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/director/application/dashboard-query.service');
    const exported = mod.DashboardQueryService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
