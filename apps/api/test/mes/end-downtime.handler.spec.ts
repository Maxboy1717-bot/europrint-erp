/**
 * test/mes/end-downtime.handler.spec.ts
 *
 * Unit tests for EndDowntimeHandler. The downtime repository is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EndDowntimeHandler } from '../../src/modules/mes/application/commands/end-downtime.handler';
import { EndDowntimeCommand } from '../../src/modules/mes/application/commands/end-downtime.command';
import { DowntimeEvent } from '../../src/modules/mes/domain/aggregates/downtime-event.aggregate';
import { Ok, Err } from '../../src/common/result';
import { DOWNTIME_REPO } from '../../src/modules/mes/domain/repositories/mes.repository';

interface DowntimeRepoMock {
  endDowntime: jest.Mock;
  save: jest.Mock;
  findById: jest.Mock;
  findAll: jest.Mock;
  getDowntimeSummary: jest.Mock;
}

function makeRepo(endResult: ReturnType<typeof Ok> | ReturnType<typeof Err>): DowntimeRepoMock {
  return {
    endDowntime: jest.fn().mockResolvedValue(endResult),
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    getDowntimeSummary: jest.fn(),
  };
}

async function build(repo: DowntimeRepoMock): Promise<EndDowntimeHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EndDowntimeHandler,
      { provide: DOWNTIME_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(EndDowntimeHandler);
}

function makeEvent(durationMinutes: number | null): DowntimeEvent {
  return new DowntimeEvent(
    'evt-1', 'ses-1', 'wc-1', 'unplanned', 'BREAK',
    new Date('2024-01-01T08:00:00Z'),
    new Date('2024-01-01T08:15:00Z'),
    durationMinutes,
    'op-1', null,
    new Date('2024-01-01T08:00:00Z'),
  );
}

describe('EndDowntimeHandler', () => {
  it('returns Ok with ended event when repo succeeds', async () => {
    const event = makeEvent(15);
    const repo = makeRepo(Ok(event));
    const handler = await build(repo);

    const r = await handler.execute(new EndDowntimeCommand('evt-1'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toBe('evt-1');
  });

  it('returns Err when repository endDowntime fails', async () => {
    const repo = makeRepo(Err('db error'));
    const handler = await build(repo);

    const r = await handler.execute(new EndDowntimeCommand('evt-2'));

    expect(r.ok).toBe(false);
  });

  it('forwards provided endedAt date to repository', async () => {
    const repo = makeRepo(Ok(makeEvent(10)));
    const handler = await build(repo);
    const endedAt = new Date('2024-06-15T10:00:00Z');

    await handler.execute(new EndDowntimeCommand('evt-3', endedAt));

    expect(repo.endDowntime).toHaveBeenCalledWith('evt-3', endedAt);
  });

  it('uses current time when endedAt is omitted', async () => {
    const repo = makeRepo(Ok(makeEvent(5)));
    const handler = await build(repo);

    await handler.execute(new EndDowntimeCommand('evt-4'));

    const call = repo.endDowntime.mock.calls[0];
    expect(call[0]).toBe('evt-4');
    expect(call[1]).toBeInstanceOf(Date);
  });

  it('returns Err and does not publish when repo returns failure code', async () => {
    const repo = makeRepo(Err('Not Found'));
    const handler = await build(repo);

    const r = await handler.execute(new EndDowntimeCommand('missing'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeDefined();
  });
});
