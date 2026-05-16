/**
 * Unit tests for StrategicRepository.
 * Covers categories, tasks, milestones, dashboard methods (within 300-line limit).
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
  strategic_categories: {
    id: 'sc.id', name: 'sc.name', description: 'sc.description', color: 'sc.color',
  },
  strategic_tasks: {
    id: 'st.id', title: 'st.title', category_id: 'st.category_id',
    assignee_id: 'st.assignee_id', due_date: 'st.due_date', priority: 'st.priority',
    description: 'st.description', status: 'st.status', progress: 'st.progress',
    created_at: 'st.created_at', updated_at: 'st.updated_at', created_by: 'st.created_by',
  },
  strategic_milestones: {
    id: 'sm.id', task_id: 'sm.task_id', title: 'sm.title',
    due_date: 'sm.due_date', description: 'sm.description', status: 'sm.status',
    updated_at: 'sm.updated_at',
  },
}));

import { StrategicRepository } from '../../src/modules/director/application/strategic.repository';

describe('StrategicRepository', () => {
  let repo: StrategicRepository;
  beforeEach(() => {
    repo = new StrategicRepository();
    dbStub.__setResolved([]);
  });

  describe('listCategories', () => {
    it('returns Ok with categories when present', async () => {
      dbStub.__setResolved([{ id: 1, name: 'Growth' }]);
      const r = await repo.listCategories();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.listCategories();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listCategories();
      expect(r.ok).toBe(false);
    });
  });

  describe('createCategory', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, name: 'Growth' }]);
      const r = await repo.createCategory('Growth', null, '#fff');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'Growth' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createCategory('X', null, '#000');
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createCategory('X', null, '#000');
      expect(r.ok).toBe(false);
    });
  });

  describe('updateCategory', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, name: 'Growth2' }]);
      const r = await repo.updateCategory(1, 'Growth2', null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, name: 'Growth2' });
    });

    it('returns Ok with default message when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateCategory(99, 'Z', null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: 'Yangilandi' });
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateCategory(1, 'X', null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('listTasks', () => {
    it('returns Ok with tasks when present', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }]);
      const r = await repo.listTasks(null, null, null, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(2);
    });

    it('returns Ok with empty array when no tasks', async () => {
      dbStub.__setResolved([]);
      const r = await repo.listTasks('completed', 5, 2, 10, 0);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.listTasks(null, null, null, 10, 0);
      expect(r.ok).toBe(false);
    });
  });

  describe('getTask', () => {
    it('returns Ok with array when task found', async () => {
      dbStub.__setResolved([{ id: 1, title: 'X' }]);
      const r = await repo.getTask(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });

    it('returns Ok with empty array when not found', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getTask(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getTask(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('createTask', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 5, title: 'T' }]);
      const r = await repo.createTask('T', null, null, null, 'low', null, 1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 5, title: 'T' });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createTask('T', null, null, null, 'low', null, 1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createTask('T', null, null, null, 'low', null, 1);
      expect(r.ok).toBe(false);
    });
  });

  describe('updateTask', () => {
    it('returns Ok with row when update succeeds', async () => {
      dbStub.__setResolved([{ id: 1, status: 'completed' }]);
      const r = await repo.updateTask(1, null, 'completed', null, null, null, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, status: 'completed' });
    });

    it('returns Ok with default message when nothing updated', async () => {
      dbStub.__setResolved([]);
      const r = await repo.updateTask(99, null, 'completed', null, null, null, null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ message: 'Yangilandi' });
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.updateTask(1, null, 'X', null, null, null, null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('createMilestone', () => {
    it('returns Ok with row when insert succeeds', async () => {
      dbStub.__setResolved([{ id: 1, task_id: 5 }]);
      const r = await repo.createMilestone(5, 'Milestone1', null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({ id: 1, task_id: 5 });
    });

    it('returns Ok with empty object when nothing returned', async () => {
      dbStub.__setResolved([]);
      const r = await repo.createMilestone(5, 'M', null, null);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual({});
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert err'));
      const r = await repo.createMilestone(5, 'M', null, null);
      expect(r.ok).toBe(false);
    });
  });

  describe('getDashboardTasksStats', () => {
    it('returns Ok with rows when present', async () => {
      dbStub.__setResolved([{ status: 'pending', cnt: 3 }]);
      const r = await repo.getDashboardTasksStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(Array.isArray(r.data)).toBe(true);
    });

    it('returns Ok with empty array when none', async () => {
      dbStub.__setResolved([]);
      const r = await repo.getDashboardTasksStats();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.getDashboardTasksStats();
      expect(r.ok).toBe(false);
    });
  });
});
