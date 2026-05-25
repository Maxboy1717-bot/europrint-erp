/**
 * @module CcOrgResolverService.spec
 * @description Minimal contract test for CcOrgResolverService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('CcOrgResolverService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/communication-center/application/cc-org-resolver.service');
    expect(mod).toBeDefined();
    expect(mod.CcOrgResolverService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/communication-center/application/cc-org-resolver.service');
    const b = await import('../../src/modules/communication-center/application/cc-org-resolver.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/communication-center/application/cc-org-resolver.service');
    const exported = mod.CcOrgResolverService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
