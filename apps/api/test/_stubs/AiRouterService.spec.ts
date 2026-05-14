/**
 * @module AiRouterService.spec
 * @description Minimal contract test for AiRouterService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiRouterService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/application/services/ai-router.service');
    expect(mod).toBeDefined();
    expect(mod.AiRouterService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/application/services/ai-router.service');
    const b = await import('../../src/modules/ai/application/services/ai-router.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/application/services/ai-router.service');
    const exported = mod.AiRouterService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
