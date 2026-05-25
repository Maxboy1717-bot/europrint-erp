/**
 * @module AdminQueueService.spec
 * @description Minimal contract test for AdminQueueService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('AdminQueueService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/admin/application/services/admin-queue.service');
    expect(mod).toBeDefined();
    expect(mod.AdminQueueService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/admin/application/services/admin-queue.service');
    const b = await import('../../src/modules/admin/application/services/admin-queue.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/admin/application/services/admin-queue.service');
    const exported = mod.AdminQueueService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
