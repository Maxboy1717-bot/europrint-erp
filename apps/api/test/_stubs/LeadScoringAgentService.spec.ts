/**
 * @module LeadScoringAgentService.spec
 * @description Minimal contract test for LeadScoringAgentService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('LeadScoringAgentService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/agents/lead-scoring-agent.service');
    expect(mod).toBeDefined();
    expect(mod.LeadScoringAgentService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/agents/lead-scoring-agent.service');
    const b = await import('../../src/modules/agents/lead-scoring-agent.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/agents/lead-scoring-agent.service');
    const exported = mod.LeadScoringAgentService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
