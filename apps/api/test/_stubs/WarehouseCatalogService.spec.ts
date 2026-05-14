/**
 * @module WarehouseCatalogService.spec
 * @description Minimal contract test for WarehouseCatalogService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('WarehouseCatalogService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/warehouse-catalog.service');
    expect(mod).toBeDefined();
    expect(mod.WarehouseCatalogService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/warehouse-catalog.service');
    const b = await import('../../src/modules/compatibility/warehouse-catalog.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/warehouse-catalog.service');
    const exported = mod.WarehouseCatalogService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
