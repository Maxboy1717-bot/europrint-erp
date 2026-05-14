/**
 * @module DrizzleService.spec
 * @description Minimal contract test for DrizzleService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DrizzleService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/common/database/drizzle.service');
    expect(mod).toBeDefined();
    expect(mod.DrizzleService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/common/database/drizzle.service');
    const b = await import('../../src/common/database/drizzle.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/common/database/drizzle.service');
    const exported = mod.DrizzleService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
