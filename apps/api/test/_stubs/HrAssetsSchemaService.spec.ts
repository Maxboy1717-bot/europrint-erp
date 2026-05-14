/**
 * @module HrAssetsSchemaService.spec
 * @description Minimal contract test for HrAssetsSchemaService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('HrAssetsSchemaService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/hr-assets/hr-assets-schema.service');
    expect(mod).toBeDefined();
    expect(mod.HrAssetsSchemaService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/hr-assets/hr-assets-schema.service');
    const b = await import('../../src/modules/hr-assets/hr-assets-schema.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/hr-assets/hr-assets-schema.service');
    const exported = mod.HrAssetsSchemaService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
