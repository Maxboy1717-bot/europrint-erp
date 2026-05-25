/**
 * test/kanban/delete-task.handler.spec.ts
 *
 * Unit tests for DeleteTaskHandler. IKanbanRepo mocked, real KanbanTask.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DeleteTaskHandler } from '../../src/modules/kanban/application/commands/delete-task.handler';
import { DeleteTaskCommand } from '../../src/modules/kanban/application/commands/delete-task.command';
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

async function build(repo: IKanbanRepo): Promise<DeleteTaskHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      DeleteTaskHandler,
      { provide: KANBAN_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(DeleteTaskHandler);
}

describe('DeleteTaskHandler', () => {
  it('returns NOT_FOUND when task does not exist', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Ok(null));
    const handler = await build(repo);

    const r = await handler.execute(new DeleteTaskCommand('id-1', '42'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when findById returns Err', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Err('boom'));
    const handler = await build(repo);

    const r = await handler.execute(new DeleteTaskCommand('id-1', '42'));

    expect(r.ok).toBe(false);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('returns FORBIDDEN when user is not the task creator', async () => {
    const repo = makeRepo();
    const task = new KanbanTask('t', 'd', 'b', 42);
    repo.findById.mockResolvedValue(Ok(task));
    const handler = await build(repo);

    const r = await handler.execute(new DeleteTaskCommand('id-1', '99'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes task when creator matches userId', async () => {
    const repo = makeRepo();
    const task = new KanbanTask('t', 'd', 'b', 42);
    repo.findById.mockResolvedValue(Ok(task));
    repo.delete.mockResolvedValue(Ok(undefined));
    const handler = await build(repo);

    const r = await handler.execute(new DeleteTaskCommand('id-1', '42'));

    expect(r.ok).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('id-1');
  });

  it('returns Err from repository when delete fails', async () => {
    const repo = makeRepo();
    const task = new KanbanTask('t', 'd', 'b', 42);
    repo.findById.mockResolvedValue(Ok(task));
    repo.delete.mockResolvedValue(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new DeleteTaskCommand('id-1', '42'));

    expect(r.ok).toBe(false);
  });
});
