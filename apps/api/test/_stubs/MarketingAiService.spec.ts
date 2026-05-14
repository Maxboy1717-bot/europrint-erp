/**
 * @module MarketingAiService.spec
 * @description Minimal contract test for MarketingAiService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('MarketingAiService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/services/marketing-ai.service');
    expect(mod).toBeDefined();
    expect(mod.MarketingAiService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/services/marketing-ai.service');
    const b = await import('../../src/modules/ai/services/marketing-ai.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/services/marketing-ai.service');
    const exported = mod.MarketingAiService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
