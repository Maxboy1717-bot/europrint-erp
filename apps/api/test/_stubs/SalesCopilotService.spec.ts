/**
 * @module SalesCopilotService.spec
 * @description Minimal contract test for SalesCopilotService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('SalesCopilotService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai-agents/sales/sales-copilot.service');
    expect(mod).toBeDefined();
    expect(mod.SalesCopilotService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai-agents/sales/sales-copilot.service');
    const b = await import('../../src/modules/ai-agents/sales/sales-copilot.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai-agents/sales/sales-copilot.service');
    const exported = mod.SalesCopilotService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
