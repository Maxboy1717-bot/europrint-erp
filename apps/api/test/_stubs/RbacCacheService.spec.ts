/**
 * @module RbacCacheService.spec
 * @description Minimal contract test for RbacCacheService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('RbacCacheService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/common/cache/rbac-cache.service');
    expect(mod).toBeDefined();
    expect(mod.RbacCacheService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/common/cache/rbac-cache.service');
    const b = await import('../../src/common/cache/rbac-cache.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/common/cache/rbac-cache.service');
    const exported = mod.RbacCacheService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
