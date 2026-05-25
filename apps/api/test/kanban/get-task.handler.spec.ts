/**
 * test/kanban/get-task.handler.spec.ts
 *
 * Unit tests for GetTaskHandler. IKanbanRepo mocked, real KanbanTask aggregate.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetTaskHandler } from '../../src/modules/kanban/application/queries/get-task.handler';
import { GetTaskQuery } from '../../src/modules/kanban/application/queries/get-task.query';
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

async function build(repo: IKanbanRepo): Promise<GetTaskHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetTaskHandler,
      { provide: KANBAN_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetTaskHandler);
}

describe('GetTaskHandler', () => {
  it('returns Ok with the task when repository finds it', async () => {
    const repo = makeRepo();
    const task = new KanbanTask('t', 'd', 'b', 1);
    repo.findById.mockResolvedValue(Ok(task));
    const handler = await build(repo);

    const r = await handler.execute(new GetTaskQuery('id-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.title).toBe('t');
  });

  it('returns NOT_FOUND error when repository returns null data', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Ok(null));
    const handler = await build(repo);

    const r = await handler.execute(new GetTaskQuery('id-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Err when repository findById returns failure', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new GetTaskQuery('id-1'));

    expect(r.ok).toBe(false);
  });

  it('forwards the queried id to repository.findById', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Ok(new KanbanTask('t', 'd', 'b', 1)));
    const handler = await build(repo);

    await handler.execute(new GetTaskQuery('uuid-xyz'));

    expect(repo.findById).toHaveBeenCalledWith('uuid-xyz');
  });
});
