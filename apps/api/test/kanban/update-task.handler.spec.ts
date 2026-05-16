/**
 * test/kanban/update-task.handler.spec.ts
 *
 * Unit tests for UpdateTaskHandler. IKanbanRepo mocked, real KanbanTask aggregate.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateTaskHandler } from '../../src/modules/kanban/application/commands/update-task.handler';
import { UpdateTaskCommand } from '../../src/modules/kanban/application/commands/update-task.command';
import { KANBAN_REPO, IKanbanRepo } from '../../src/modules/kanban/domain/repositories/i-kanban.repo';
import { KanbanTask } from '../../src/modules/kanban/domain/aggregates/kanban-task.aggregate';
import { TaskStatus, TaskPriority } from '../../src/modules/kanban/domain/enums/task-status.enum';
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

async function build(repo: IKanbanRepo): Promise<UpdateTaskHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UpdateTaskHandler,
      { provide: KANBAN_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(UpdateTaskHandler);
}

function makeTask(status: TaskStatus = TaskStatus.TODO): KanbanTask {
  const t = new KanbanTask('orig', 'orig-desc', 'b', 1);
  t.status = status;
  return t;
}

describe('UpdateTaskHandler', () => {
  it('returns NOT_FOUND when findById finds nothing', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Ok(null));
    const handler = await build(repo);

    const r = await handler.execute(new UpdateTaskCommand('id'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('rejects illegal status transition (todo → done)', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(Ok(makeTask(TaskStatus.TODO)));
    const handler = await build(repo);

    const r = await handler.execute(new UpdateTaskCommand('id', 'done'));

    expect(r.ok).toBe(false);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('accepts legal status transition (todo → in_progress)', async () => {
    const repo = makeRepo();
    const task = makeTask(TaskStatus.TODO);
    repo.findById.mockResolvedValue(Ok(task));
    repo.update.mockResolvedValue(Ok(task));
    const handler = await build(repo);

    const r = await handler.execute(new UpdateTaskCommand('id', 'in_progress'));

    expect(r.ok).toBe(true);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('applies title, description and priority overrides before update', async () => {
    const repo = makeRepo();
    const task = makeTask(TaskStatus.TODO);
    repo.findById.mockResolvedValue(Ok(task));
    repo.update.mockResolvedValue(Ok(task));
    const handler = await build(repo);

    await handler.execute(
      new UpdateTaskCommand('id', undefined, 'NewTitle', 'NewDesc', undefined, TaskPriority.URGENT),
    );

    expect(task.title).toBe('NewTitle');
    expect(task.description).toBe('NewDesc');
    expect(task.priority).toBe(TaskPriority.URGENT);
  });

  it('returns Err when repository update fails', async () => {
    const repo = makeRepo();
    const task = makeTask(TaskStatus.TODO);
    repo.findById.mockResolvedValue(Ok(task));
    repo.update.mockResolvedValue(Err('db error'));
    const handler = await build(repo);

    const r = await handler.execute(new UpdateTaskCommand('id', undefined, 'X'));

    expect(r.ok).toBe(false);
  });
});
