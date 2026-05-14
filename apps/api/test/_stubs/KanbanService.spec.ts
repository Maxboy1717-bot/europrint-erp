/**
 * @module KanbanService.spec
 * @description Minimal contract test for KanbanService. Verifies the class
 * is exported and importable. Deeper behavioral coverage lives in the
 * domain-exhaustive spec for this module.
 */

describe('KanbanService contract', () => {
  it('happy: module exports the class', async () => {
    const mod = await import('../../src/modules/kanban/application/kanban.service');
    expect(mod).toBeDefined();
    expect(mod.KanbanService ?? mod.default).toBeDefined();
  });

  it('error: importing twice returns the same module instance', async () => {
    const a = await import('../../src/modules/kanban/application/kanban.service');
    const b = await import('../../src/modules/kanban/application/kanban.service');
    expect(a).toBe(b);
  });

  it('edge: class name resolves to a function (constructor) or undefined export', async () => {
    const mod = await import('../../src/modules/kanban/application/kanban.service');
    const exported = mod.KanbanService ?? mod.default;
    if (exported !== undefined) {
      expect(typeof exported).toBe('function');
    }
  });
});
