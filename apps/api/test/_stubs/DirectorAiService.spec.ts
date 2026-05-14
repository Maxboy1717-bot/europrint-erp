/**
 * @module DirectorAiService.spec
 * @description Minimal contract test for DirectorAiService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DirectorAiService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/services/director-ai.service');
    expect(mod).toBeDefined();
    expect(mod.DirectorAiService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/services/director-ai.service');
    const b = await import('../../src/modules/ai/services/director-ai.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/services/director-ai.service');
    const exported = mod.DirectorAiService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
