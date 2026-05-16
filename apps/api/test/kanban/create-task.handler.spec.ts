/**
 * test/kanban/create-task.handler.spec.ts
 *
 * Unit tests for CreateTaskHandler. EventBus + IKanbanRepo mocked,
 * KanbanTask aggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateTaskHandler } from '../../src/modules/kanban/application/commands/create-task.handler';
import { CreateTaskCommand } from '../../src/modules/kanban/application/commands/create-task.command';
import { KANBAN_REPO, IKanbanRepo } from '../../src/modules/kanban/domain/repositories/i-kanban.repo';
import { TaskPriority } from '../../src/modules/kanban/domain/enums/task-status.enum';
import { KanbanTask } from '../../src/modules/kanban/domain/aggregates/kanban-task.aggregate';
import { TaskCreatedEvent } from '../../src/modules/kanban/domain/events';
import { Ok, Err } from '../../src/common/result';

function makeRepo(saveResult: ReturnType<typeof Ok> | ReturnType<typeof Err>): jest.Mocked<IKanbanRepo> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByAssignee: jest.fn(),
    save: jest.fn().mockResolvedValue(saveResult),
    update: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<IKanbanRepo>;
}

async function build(repo: IKanbanRepo, bus: EventBus): Promise<CreateTaskHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateTaskHandler,
      { provide: KANBAN_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
    ],
  }).compile();
  return module.get(CreateTaskHandler);
}

describe('CreateTaskHandler', () => {
  it('creates task and publishes TaskCreatedEvent when repo saves successfully', async () => {
    const dummyTask = new KanbanTask('t', 'd', 'b', 1);
    const repo = makeRepo(Ok(dummyTask));
    const publish = jest.fn();
    const bus = { publish } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CreateTaskCommand('Title', 'Desc', 'board-1', 42));

    expect(r.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish.mock.calls[0][0]).toBeInstanceOf(TaskCreatedEvent);
  });

  it('returns Err when repository save fails', async () => {
    const repo = makeRepo(Err('db down'));
    const publish = jest.fn();
    const bus = { publish } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CreateTaskCommand('t', 'd', 'b', 1));

    expect(r.ok).toBe(false);
    expect(publish).not.toHaveBeenCalled();
  });

  it('returns task id (string) on success', async () => {
    const repo = makeRepo(Ok(new KanbanTask('x', 'y', 'b', 1)));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CreateTaskCommand('t', 'd', 'b', 1));

    expect(r.ok).toBe(true);
    if (r.ok) expect(typeof r.data).toBe('string');
  });

  it('defaults priority to MEDIUM when command priority is missing', async () => {
    const repo = makeRepo(Ok(new KanbanTask('t', 'd', 'b', 1)));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    await handler.execute(new CreateTaskCommand('t', 'd', 'b', 1));

    const savedTask = repo.save.mock.calls[0][0];
    expect(savedTask.priority).toBe(TaskPriority.MEDIUM);
  });

  it('passes provided priority through to the saved task', async () => {
    const repo = makeRepo(Ok(new KanbanTask('t', 'd', 'b', 1)));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    await handler.execute(new CreateTaskCommand('t', 'd', 'b', 1, TaskPriority.HIGH));

    const savedTask = repo.save.mock.calls[0][0];
    expect(savedTask.priority).toBe(TaskPriority.HIGH);
  });
});
