/**
 * @module AiExamService.spec
 * @description Minimal contract test for AiExamService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AiExamService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/ai/application/services/ai-exam.service');
    expect(mod).toBeDefined();
    expect(mod.AiExamService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/ai/application/services/ai-exam.service');
    const b = await import('../../src/modules/ai/application/services/ai-exam.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/ai/application/services/ai-exam.service');
    const exported = mod.AiExamService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
