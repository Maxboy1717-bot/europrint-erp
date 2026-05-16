/**
 * test/mes/record-downtime.handler.spec.ts
 *
 * Unit tests for RecordDowntimeHandler. The downtime + mes repositories are mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  RecordDowntimeCommand,
  RecordDowntimeHandler,
} from '../../src/modules/mes/application/commands/record-downtime.handler';
import { DowntimeEvent } from '../../src/modules/mes/domain/aggregates/downtime-event.aggregate';
import { Ok, Err } from '../../src/common/result';
import { MES_REPO, DOWNTIME_REPO } from '../../src/modules/mes/domain/repositories/mes.repository';

interface DowntimeRepoMock {
  save: jest.Mock;
  endDowntime: jest.Mock;
  findById: jest.Mock;
  findAll: jest.Mock;
  getDowntimeSummary: jest.Mock;
}

function makeDowntimeRepo(saveResult: ReturnType<typeof Ok> | ReturnType<typeof Err>): DowntimeRepoMock {
  return {
    save: jest.fn().mockResolvedValue(saveResult),
    endDowntime: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    getDowntimeSummary: jest.fn(),
  };
}

async function build(downtimeRepo: DowntimeRepoMock): Promise<RecordDowntimeHandler> {
  const mesRepo = {
    saveSession: jest.fn(),
    getSession: jest.fn(),
    getSessionByPpId: jest.fn(),
    getAllSessionsByStatus: jest.fn(),
    checkOperatorCertification: jest.fn(),
  };
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RecordDowntimeHandler,
      { provide: DOWNTIME_REPO, useValue: downtimeRepo },
      { provide: MES_REPO, useValue: mesRepo },
    ],
  }).compile();
  return module.get(RecordDowntimeHandler);
}

function sampleEvent(): DowntimeEvent {
  return new DowntimeEvent(
    'new-id', 'ses-1', 'wc-1', 'unplanned', 'BREAK',
    new Date(), null, null, 'op-1', null, new Date(),
  );
}

describe('RecordDowntimeHandler', () => {
  it('returns Err when reasonCode is empty string', async () => {
    const repo = makeDowntimeRepo(Ok(sampleEvent()));
    const handler = await build(repo);

    const r = await handler.execute(
      new RecordDowntimeCommand('ses-1', 'unplanned', '', 'op-1'),
    );

    expect(r.ok).toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns Err when reasonCode is whitespace only', async () => {
    const repo = makeDowntimeRepo(Ok(sampleEvent()));
    const handler = await build(repo);

    const r = await handler.execute(
      new RecordDowntimeCommand('ses-1', 'unplanned', '   ', 'op-1'),
    );

    expect(r.ok).toBe(false);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('persists a downtime event when reason is valid', async () => {
    const repo = makeDowntimeRepo(Ok(sampleEvent()));
    const handler = await build(repo);

    const r = await handler.execute(
      new RecordDowntimeCommand('ses-1', 'unplanned', 'BREAK', 'op-1', 'wc-1', 'notes'),
    );

    expect(r.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    const passed = repo.save.mock.calls[0][0] as DowntimeEvent;
    expect(passed.reasonCode).toBe('BREAK');
    expect(passed.sessionId).toBe('ses-1');
    expect(passed.workCenterId).toBe('wc-1');
    expect(passed.notes).toBe('notes');
  });

  it('defaults optional workCenterId and notes to null', async () => {
    const repo = makeDowntimeRepo(Ok(sampleEvent()));
    const handler = await build(repo);

    await handler.execute(
      new RecordDowntimeCommand('ses-1', 'unplanned', 'BREAK', 'op-1'),
    );

    const passed = repo.save.mock.calls[0][0] as DowntimeEvent;
    expect(passed.workCenterId).toBeNull();
    expect(passed.notes).toBeNull();
  });

  it('returns Err when repository save fails', async () => {
    const repo = makeDowntimeRepo(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(
      new RecordDowntimeCommand('ses-1', 'unplanned', 'BREAK', 'op-1'),
    );

    expect(r.ok).toBe(false);
  });
});
