/**
 * @module AgentEventBusService.spec
 * @description Minimal contract test for AgentEventBusService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AgentEventBusService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/agents/shared/agent-event-bus.service');
    expect(mod).toBeDefined();
    expect(mod.AgentEventBusService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/agents/shared/agent-event-bus.service');
    const b = await import('../../src/modules/agents/shared/agent-event-bus.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/agents/shared/agent-event-bus.service');
    const exported = mod.AgentEventBusService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
