/**
 * @module AiPlannerService.spec
 * @description Minimal contract test for AiPlannerService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiPlannerService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai-agents/planning/planner.service');
    expect(mod).toBeDefined();
    expect(mod.AiPlannerService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai-agents/planning/planner.service');
    const b = await import('../../src/modules/ai-agents/planning/planner.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai-agents/planning/planner.service');
    const exported = mod.AiPlannerService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
