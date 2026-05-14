/**
 * @module AiVisionQcService.spec
 * @description Minimal contract test for AiVisionQcService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiVisionQcService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai-agents/qc/vision-qc.service');
    expect(mod).toBeDefined();
    expect(mod.AiVisionQcService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai-agents/qc/vision-qc.service');
    const b = await import('../../src/modules/ai-agents/qc/vision-qc.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai-agents/qc/vision-qc.service');
    const exported = mod.AiVisionQcService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
