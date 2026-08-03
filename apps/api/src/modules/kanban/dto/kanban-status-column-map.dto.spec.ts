/**
 * @module kanban-status-column-map.dto.spec
 * @description Jest / Vitest test suite.
 */

import {
  KanbanCreateStatusColumnMapSchema,
  KanbanUpdateStatusColumnMapSchema,
} from './kanban-status-column-map.dto';

describe('KanbanCreateStatusColumnMapSchema', () => {
  it('accepts a valid sdStatus + kanbanColumnId pair', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({ sdStatus: 'shipped', kanbanColumnId: 8 });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from sdStatus', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({ sdStatus: '  draft  ', kanbanColumnId: 2 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sdStatus).toBe('draft');
  });

  it('rejects empty sdStatus', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({ sdStatus: '', kanbanColumnId: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects sdStatus over 64 chars', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({ sdStatus: 'x'.repeat(65), kanbanColumnId: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive kanbanColumnId', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({ sdStatus: 'draft', kanbanColumnId: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer kanbanColumnId', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({ sdStatus: 'draft', kanbanColumnId: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = KanbanCreateStatusColumnMapSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('KanbanUpdateStatusColumnMapSchema', () => {
  it('accepts sdStatus only', () => {
    const result = KanbanUpdateStatusColumnMapSchema.safeParse({ sdStatus: 'delivered' });
    expect(result.success).toBe(true);
  });

  it('accepts kanbanColumnId only', () => {
    const result = KanbanUpdateStatusColumnMapSchema.safeParse({ kanbanColumnId: 3 });
    expect(result.success).toBe(true);
  });

  it('accepts both fields', () => {
    const result = KanbanUpdateStatusColumnMapSchema.safeParse({ sdStatus: 'closed', kanbanColumnId: 8 });
    expect(result.success).toBe(true);
  });

  it('rejects an empty payload (must set at least one field)', () => {
    const result = KanbanUpdateStatusColumnMapSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive kanbanColumnId', () => {
    const result = KanbanUpdateStatusColumnMapSchema.safeParse({ kanbanColumnId: -1 });
    expect(result.success).toBe(false);
  });
});
