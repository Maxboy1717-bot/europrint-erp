/**
 * test/mes/complete-session.handler.spec.ts
 *
 * Unit tests for CompleteSessionHandler. Real ProductionSession aggregate;
 * IMesRepository and EventBus are mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import {
  CompleteSessionCommand,
  CompleteSessionHandler,
} from '../../src/modules/mes/application/commands/complete-session.handler';
import {
  ProductionSession,
  MesStatus,
} from '../../src/modules/mes/domain/aggregates/production-session.aggregate';
import { IMesRepository, MES_REPO } from '../../src/modules/mes/domain/repositories/mes.repository';
import { Ok, Err } from '../../src/common/result';
import { MesCompletedEvent } from '../../src/modules/mes/domain/events/mes-completed.event';
import { MesToHr360Event } from '../../src/modules/mes/domain/events/mes-to-hr-360.event';

function readyToComplete(): ProductionSession {
  const s = new ProductionSession(7, 12, 4, 88, false);
  s.passChecklist();
  s.start();
  return s;
}

function makeRepo(getSession: jest.Mock): jest.Mocked<IMesRepository> {
  const repo = {
    getSession,
    getSessionByPpId: jest.fn(),
    getAllSessionsByStatus: jest.fn(),
    saveSession: jest.fn().mockResolvedValue(Ok(7)),
    checkOperatorCertification: jest.fn(),
    withTransaction: jest.fn(),
  } as jest.Mocked<IMesRepository>;
  (repo.withTransaction as jest.Mock).mockImplementation(
    async (cb: (tx: unknown) => unknown) => cb(null),
  );
  return repo;
}

async function build(repo: IMesRepository, bus: EventBus): Promise<CompleteSessionHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CompleteSessionHandler,
      { provide: MES_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
    ],
  }).compile();
  return module.get(CompleteSessionHandler);
}

describe('CompleteSessionHandler', () => {
  it('returns Err when session is not found', async () => {
    const repo = makeRepo(jest.fn().mockResolvedValue(Err('missing')));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CompleteSessionCommand(7));

    expect(r.ok).toBe(false);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('completes RUNNING session and moves it to SENT_TO_QC', async () => {
    const session = readyToComplete();
    const repo = makeRepo(jest.fn().mockResolvedValue(Ok(session)));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CompleteSessionCommand(7));

    expect(r.ok).toBe(true);
    expect(session.getStatus()).toBe(MesStatus.SENT_TO_QC);
    expect(repo.saveSession).toHaveBeenCalledWith(session, null);
  });

  it('publishes MES_COMPLETED and MES_TO_HR_360 events on success', async () => {
    const session = readyToComplete();
    const repo = makeRepo(jest.fn().mockResolvedValue(Ok(session)));
    const publish = jest.fn();
    const bus = { publish } as unknown as EventBus;
    const handler = await build(repo, bus);

    await handler.execute(new CompleteSessionCommand(7));

    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish.mock.calls[0][0]).toBeInstanceOf(MesCompletedEvent);
    expect(publish.mock.calls[1][0]).toBeInstanceOf(MesToHr360Event);
  });

  it('returns Err when session is still READY (cannot complete)', async () => {
    const fresh = new ProductionSession(7, 12, 4, 88, false);
    const repo = makeRepo(jest.fn().mockResolvedValue(Ok(fresh)));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CompleteSessionCommand(7));

    expect(r.ok).toBe(false);
    expect(repo.saveSession).not.toHaveBeenCalled();
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('returns Err when saveSession fails after completion', async () => {
    const session = readyToComplete();
    const repo = makeRepo(jest.fn().mockResolvedValue(Ok(session)));
    repo.saveSession.mockResolvedValueOnce(Err('db gone'));
    const bus = { publish: jest.fn() } as unknown as EventBus;
    const handler = await build(repo, bus);

    const r = await handler.execute(new CompleteSessionCommand(7));

    expect(r.ok).toBe(false);
    expect(bus.publish).not.toHaveBeenCalled();
  });
});
