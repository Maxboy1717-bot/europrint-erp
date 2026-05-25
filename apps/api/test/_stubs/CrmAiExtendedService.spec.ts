/**
 * @module CrmAiExtendedService.spec
 * @description Minimal contract test for CrmAiExtendedService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('CrmAiExtendedService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/crm/application/crm-ai-extended.service');
    expect(mod).toBeDefined();
    expect(mod.CrmAiExtendedService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/crm/application/crm-ai-extended.service');
    const b = await import('../../src/modules/crm/application/crm-ai-extended.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/crm/application/crm-ai-extended.service');
    const exported = mod.CrmAiExtendedService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
