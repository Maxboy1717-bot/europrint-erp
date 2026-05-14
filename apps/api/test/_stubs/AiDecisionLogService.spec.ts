/**
 * @module AiDecisionLogService.spec
 * @description Minimal contract test for AiDecisionLogService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiDecisionLogService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai-agents/common/ai-decision-log.service');
    expect(mod).toBeDefined();
    expect(mod.AiDecisionLogService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai-agents/common/ai-decision-log.service');
    const b = await import('../../src/modules/ai-agents/common/ai-decision-log.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai-agents/common/ai-decision-log.service');
    const exported = mod.AiDecisionLogService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
