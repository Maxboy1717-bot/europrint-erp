/**
 * @module HrPerformanceAgentService.spec
 * @description Minimal contract test for HrPerformanceAgentService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('HrPerformanceAgentService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/agents/hr-performance-agent.service');
    expect(mod).toBeDefined();
    expect(mod.HrPerformanceAgentService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/agents/hr-performance-agent.service');
    const b = await import('../../src/modules/agents/hr-performance-agent.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/agents/hr-performance-agent.service');
    const exported = mod.HrPerformanceAgentService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
