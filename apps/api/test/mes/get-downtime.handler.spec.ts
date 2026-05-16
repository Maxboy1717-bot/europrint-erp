/**
 * test/mes/get-downtime.handler.spec.ts
 *
 * Unit tests for GetDowntimeHandler. The downtime repository is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetDowntimeHandler } from '../../src/modules/mes/application/queries/get-downtime.handler';
import { GetDowntimeQuery } from '../../src/modules/mes/application/queries/get-downtime.query';
import { DowntimeEvent } from '../../src/modules/mes/domain/aggregates/downtime-event.aggregate';
import { Ok, Err } from '../../src/common/result';
import { DOWNTIME_REPO } from '../../src/modules/mes/domain/repositories/mes.repository';

interface RepoMock {
  findAll: jest.Mock;
  findById: jest.Mock;
  save: jest.Mock;
  endDowntime: jest.Mock;
  getDowntimeSummary: jest.Mock;
}

function makeRepo(result: ReturnType<typeof Ok> | ReturnType<typeof Err>): RepoMock {
  return {
    findAll: jest.fn().mockResolvedValue(result),
    findById: jest.fn(),
    save: jest.fn(),
    endDowntime: jest.fn(),
    getDowntimeSummary: jest.fn(),
  };
}

async function build(repo: RepoMock): Promise<GetDowntimeHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetDowntimeHandler,
      { provide: DOWNTIME_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetDowntimeHandler);
}

function makeEvent(id: string): DowntimeEvent {
  return new DowntimeEvent(
    id, 'ses-1', 'wc-1', 'unplanned', 'BREAK',
    new Date(), null, null, 'op-1', null, new Date(),
  );
}

describe('GetDowntimeHandler', () => {
  it('returns Ok with paginated items when repository succeeds', async () => {
    const items = [makeEvent('a'), makeEvent('b')];
    const repo = makeRepo(Ok({ items, total: 2 }));
    const handler = await build(repo);

    const r = await handler.execute(new GetDowntimeQuery({ page: 1, limit: 10 }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('forwards filters object to repository.findAll', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await build(repo);
    const filters = { sessionId: 's', workCenterId: 'wc', page: 2, limit: 5 };

    await handler.execute(new GetDowntimeQuery(filters));

    expect(repo.findAll).toHaveBeenCalledWith(filters);
  });

  it('returns Err when repository findAll fails', async () => {
    const repo = makeRepo(Err('db down'));
    const handler = await build(repo);

    const r = await handler.execute(new GetDowntimeQuery({}));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with empty items when repository returns empty list', async () => {
    const repo = makeRepo(Ok({ items: [], total: 0 }));
    const handler = await build(repo);

    const r = await handler.execute(new GetDowntimeQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toEqual([]);
      expect(r.data.total).toBe(0);
    }
  });
});
