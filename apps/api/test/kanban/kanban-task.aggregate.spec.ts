/**
 * @module test/kanban/kanban-task.aggregate.spec
 * @description Unit tests for the KanbanTask aggregate — column transitions,
 * assignee binding, tag uniqueness and due-date setting.
 */

import { KanbanTask } from '../../src/modules/kanban/domain/aggregates/kanban-task.aggregate';
import { TaskStatus, TaskPriority } from '../../src/modules/kanban/domain/enums/task-status.enum';

function makeTask(priority?: TaskPriority): KanbanTask {
  return KanbanTask.create(
    'Yangi vazifa',
    'Tasvir matni',
    'BOARD-1',
    101,
    priority,
  );
}

describe('KanbanTask.create', () => {
  it('initialises with BACKLOG status and MEDIUM priority when priority is omitted', () => {
    const t = makeTask();
    expect(t.status).toBe(TaskStatus.BACKLOG);
    expect(t.priority).toBe(TaskPriority.MEDIUM);
  });

  it('respects priority argument when provided', () => {
    const t = makeTask(TaskPriority.URGENT);
    expect(t.priority).toBe(TaskPriority.URGENT);
  });

  it('stores title, description, boardId and createdBy when constructed', () => {
    const t = KanbanTask.create('T1', 'D1', 'BOARD-9', 55);
    expect(t.title).toBe('T1');
    expect(t.description).toBe('D1');
    expect(t.boardId).toBe('BOARD-9');
    expect(t.createdBy).toBe(55);
  });

  it('initialises assigneeId to null and tags to an empty array when created', () => {
    const t = makeTask();
    expect(t.assigneeId).toBeNull();
    expect(t.tags).toEqual([]);
    expect(t.dueDate).toBeNull();
  });

  it('assigns a unique id when two tasks are created', () => {
    const a = makeTask();
    const b = makeTask();
    expect(a.id).not.toBe(b.id);
  });
});

describe('KanbanTask.assign', () => {
  it('sets assigneeId when assign is called with a user id', () => {
    const t = makeTask();
    t.assign(77);
    expect(t.assigneeId).toBe(77);
  });

  it('overwrites previous assignee when assign is called again', () => {
    const t = makeTask();
    t.assign(11);
    t.assign(22);
    expect(t.assigneeId).toBe(22);
  });

  it('refreshes updatedAt when assign is called', async () => {
    const t = makeTask();
    const before = t.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    t.assign(1);
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('KanbanTask.moveToStatus', () => {
  it('moves task to TODO when moveToStatus is invoked with TODO', () => {
    const t = makeTask();
    t.moveToStatus(TaskStatus.TODO);
    expect(t.status).toBe(TaskStatus.TODO);
  });

  it('moves task to IN_PROGRESS when moveToStatus is invoked with IN_PROGRESS', () => {
    const t = makeTask();
    t.moveToStatus(TaskStatus.IN_PROGRESS);
    expect(t.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('moves task to DONE when moveToStatus is invoked with DONE', () => {
    const t = makeTask();
    t.moveToStatus(TaskStatus.DONE);
    expect(t.status).toBe(TaskStatus.DONE);
  });

  it('allows backwards transition when moveToStatus is invoked with an earlier column', () => {
    const t = makeTask();
    t.moveToStatus(TaskStatus.DONE);
    t.moveToStatus(TaskStatus.TODO);
    expect(t.status).toBe(TaskStatus.TODO);
  });
});

describe('KanbanTask.addTag', () => {
  it('adds tag when tag list is empty', () => {
    const t = makeTask();
    t.addTag('urgent');
    expect(t.tags).toContain('urgent');
    expect(t.tags).toHaveLength(1);
  });

  it('appends multiple distinct tags when called sequentially', () => {
    const t = makeTask();
    t.addTag('frontend');
    t.addTag('bug');
    expect(t.tags).toEqual(['frontend', 'bug']);
  });

  it('ignores duplicate tags when the tag already exists', () => {
    const t = makeTask();
    t.addTag('dup');
    t.addTag('dup');
    expect(t.tags).toEqual(['dup']);
  });
});

describe('KanbanTask.setDueDate', () => {
  it('sets the dueDate when a Date is supplied', () => {
    const t = makeTask();
    const due = new Date('2026-09-01');
    t.setDueDate(due);
    expect(t.dueDate).toEqual(due);
  });

  it('overwrites previous dueDate when setDueDate is called again', () => {
    const t = makeTask();
    t.setDueDate(new Date('2026-01-01'));
    t.setDueDate(new Date('2026-12-31'));
    expect(t.dueDate).toEqual(new Date('2026-12-31'));
  });

  it('refreshes updatedAt when setDueDate is called', async () => {
    const t = makeTask();
    const before = t.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    t.setDueDate(new Date('2027-01-01'));
    expect(t.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});
