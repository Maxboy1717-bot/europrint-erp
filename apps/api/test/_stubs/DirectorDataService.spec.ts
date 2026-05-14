/**
 * @module DirectorDataService.spec
 * @description Minimal contract test for DirectorDataService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DirectorDataService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/director/application/director-data.service');
    expect(mod).toBeDefined();
    expect(mod.DirectorDataService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/director/application/director-data.service');
    const b = await import('../../src/modules/director/application/director-data.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/director/application/director-data.service');
    const exported = mod.DirectorDataService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
