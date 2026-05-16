/**
 * test/kanban/get-tasks.handler.spec.ts
 *
 * Unit tests for GetTasksHandler. IKanbanRepo mocked, real KanbanTask aggregate.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetTasksHandler } from '../../src/modules/kanban/application/queries/get-tasks.handler';
import { GetTasksQuery } from '../../src/modules/kanban/application/queries/get-tasks.query';
import { KANBAN_REPO, IKanbanRepo } from '../../src/modules/kanban/domain/repositories/i-kanban.repo';
import { KanbanTask } from '../../src/modules/kanban/domain/aggregates/kanban-task.aggregate';
import { Ok, Err } from '../../src/common/result';

function makeRepo(): jest.Mocked<IKanbanRepo> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByAssignee: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<IKanbanRepo>;
}

async function build(repo: IKanbanRepo): Promise<GetTasksHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetTasksHandler,
      { provide: KANBAN_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetTasksHandler);
}

describe('GetTasksHandler', () => {
  it('returns paginated tasks when repository succeeds', async () => {
    const repo = makeRepo();
    const items = [new KanbanTask('a', 'x', 'b', 1), new KanbanTask('b', 'y', 'b', 1)];
    repo.findAll.mockResolvedValue(Ok({ items, total: 2 }));
    const handler = await build(repo);

    const r = await handler.execute(new GetTasksQuery({ page: 1, limit: 10 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('uses default page=1, limit=10 when filters omit them', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = await build(repo);

    const r = await handler.execute(new GetTasksQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('forwards filters to repository.findAll', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));
    const handler = await build(repo);
    const filters = { status: 'todo', assignedTo: 'u1', page: 2, limit: 5 };

    await handler.execute(new GetTasksQuery(filters));

    expect(repo.findAll).toHaveBeenCalledWith(filters);
  });

  it('returns Err when repository findAll fails', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new GetTasksQuery({}));

    expect(r.ok).toBe(false);
  });
});
