/**
 * @module DocumentWorkflowV2Service.spec
 * @description Minimal contract test for DocumentWorkflowV2Service. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('DocumentWorkflowV2Service contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/document-workflow-v2.service');
    expect(mod).toBeDefined();
    expect(mod.DocumentWorkflowV2Service ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/document-workflow-v2.service');
    const b = await import('../../src/modules/compatibility/document-workflow-v2.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/document-workflow-v2.service');
    const exported = mod.DocumentWorkflowV2Service ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
