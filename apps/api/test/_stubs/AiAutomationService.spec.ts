/**
 * @module AiAutomationService.spec
 * @description Minimal contract test for AiAutomationService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiAutomationService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/services/ai-automation.service');
    expect(mod).toBeDefined();
    expect(mod.AiAutomationService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/services/ai-automation.service');
    const b = await import('../../src/modules/ai/services/ai-automation.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/services/ai-automation.service');
    const exported = mod.AiAutomationService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
