/**
 * @module AiHrNewService.spec
 * @description Minimal contract test for AiHrNewService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiHrNewService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/application/services/ai-hr-new.service');
    expect(mod).toBeDefined();
    expect(mod.AiHrNewService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/application/services/ai-hr-new.service');
    const b = await import('../../src/modules/ai/application/services/ai-hr-new.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/application/services/ai-hr-new.service');
    const exported = mod.AiHrNewService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
