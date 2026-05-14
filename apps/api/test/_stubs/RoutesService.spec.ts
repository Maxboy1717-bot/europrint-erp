/**
 * @module RoutesService.spec
 * @description Minimal contract test for RoutesService.
 */

describe('RoutesService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/logistics/routes/routes.service');
    expect(mod).toBeDefined();
    expect(mod.RoutesService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/logistics/routes/routes.service');
    const b = await import('../../src/modules/logistics/routes/routes.service');
    expect(a).toBe(b);
  });

  it('edge: exported value is a constructor function', async () => {
    const mod = await import('../../src/modules/logistics/routes/routes.service');
    const exported = mod.RoutesService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
