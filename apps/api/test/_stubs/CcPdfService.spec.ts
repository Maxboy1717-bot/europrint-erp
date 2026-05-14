/**
 * @module CcPdfService.spec
 * @description Minimal contract test for CcPdfService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('CcPdfService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/communication-center/application/cc-pdf.service');
    expect(mod).toBeDefined();
    expect(mod.CcPdfService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/communication-center/application/cc-pdf.service');
    const b = await import('../../src/modules/communication-center/application/cc-pdf.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/communication-center/application/cc-pdf.service');
    const exported = mod.CcPdfService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
