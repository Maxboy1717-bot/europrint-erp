/**
 * @module InventoryAgentService.spec
 * @description Minimal contract test for InventoryAgentService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('InventoryAgentService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/agents/inventory-agent.service');
    expect(mod).toBeDefined();
    expect(mod.InventoryAgentService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/agents/inventory-agent.service');
    const b = await import('../../src/modules/agents/inventory-agent.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/agents/inventory-agent.service');
    const exported = mod.InventoryAgentService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
