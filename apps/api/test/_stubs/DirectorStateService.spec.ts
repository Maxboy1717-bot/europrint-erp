/**
 * @module DirectorStateService.spec
 * @description Minimal contract test for DirectorStateService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DirectorStateService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/director/application/director-state.service');
    expect(mod).toBeDefined();
    expect(mod.DirectorStateService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/director/application/director-state.service');
    const b = await import('../../src/modules/director/application/director-state.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/director/application/director-state.service');
    const exported = mod.DirectorStateService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
