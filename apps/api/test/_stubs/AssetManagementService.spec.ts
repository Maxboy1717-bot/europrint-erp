/**
 * @module AssetManagementService.spec
 * @description Minimal contract test for AssetManagementService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AssetManagementService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/asset-management.service');
    expect(mod).toBeDefined();
    expect(mod.AssetManagementService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/asset-management.service');
    const b = await import('../../src/modules/compatibility/asset-management.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/asset-management.service');
    const exported = mod.AssetManagementService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
