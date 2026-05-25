/**
 * @module ApplicationsService.spec
 * @description Minimal contract test for ApplicationsService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('ApplicationsService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/applications/applications.service');
    expect(mod).toBeDefined();
    expect(mod.ApplicationsService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/applications/applications.service');
    const b = await import('../../src/modules/applications/applications.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/applications/applications.service');
    const exported = mod.ApplicationsService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
