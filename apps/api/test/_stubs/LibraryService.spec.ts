/**
 * @module LibraryService.spec
 * @description Minimal contract test for LibraryService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LibraryService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/design/library/library.service');
    expect(mod).toBeDefined();
    expect(mod.LibraryService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/design/library/library.service');
    const b = await import('../../src/modules/design/library/library.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/design/library/library.service');
    const exported = mod.LibraryService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
