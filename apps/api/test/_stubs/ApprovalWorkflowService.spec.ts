/**
 * @module ApprovalWorkflowService.spec
 * @description Minimal contract test for ApprovalWorkflowService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('ApprovalWorkflowService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/compatibility/approval-workflow.service');
    expect(mod).toBeDefined();
    expect(mod.ApprovalWorkflowService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/compatibility/approval-workflow.service');
    const b = await import('../../src/modules/compatibility/approval-workflow.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/compatibility/approval-workflow.service');
    const exported = mod.ApprovalWorkflowService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
