/**
 * test/mes/get-downtime-summary.handler.spec.ts
 *
 * Unit tests for GetDowntimeSummaryHandler. The downtime repository is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GetDowntimeSummaryHandler } from '../../src/modules/mes/application/queries/get-downtime-summary.handler';
import { GetDowntimeSummaryQuery } from '../../src/modules/mes/application/queries/get-downtime-summary.query';
import { DowntimeSummary } from '../../src/modules/mes/infrastructure/repositories/drizzle-downtime.repo';
import { Ok, Err } from '../../src/common/result';
import { DOWNTIME_REPO } from '../../src/modules/mes/domain/repositories/mes.repository';

interface RepoMock {
  getDowntimeSummary: jest.Mock;
  findAll: jest.Mock;
  findById: jest.Mock;
  save: jest.Mock;
  endDowntime: jest.Mock;
}

function makeRepo(result: ReturnType<typeof Ok> | ReturnType<typeof Err>): RepoMock {
  return {
    getDowntimeSummary: jest.fn().mockResolvedValue(result),
    findAll: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    endDowntime: jest.fn(),
  };
}

async function build(repo: RepoMock): Promise<GetDowntimeSummaryHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GetDowntimeSummaryHandler,
      { provide: DOWNTIME_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(GetDowntimeSummaryHandler);
}

const summary: DowntimeSummary = {
  totalDowntimeHours: 4.5,
  totalDowntimeMinutes: 270,
  totalEvents: 3,
  topReasons: [{ code: 'BREAK', name: 'Mashina nosozligi', count: 2 }],
  mostAffectedWorkCenter: { id: 'wc-1', name: 'Press', downtimeMinutes: 200 },
};

describe('GetDowntimeSummaryHandler', () => {
  const from = new Date('2024-01-01T00:00:00Z');
  const to = new Date('2024-01-31T23:59:59Z');

  it('returns Ok with summary when repo succeeds', async () => {
    const repo = makeRepo(Ok(summary));
    const handler = await build(repo);

    const r = await handler.execute(new GetDowntimeSummaryQuery(from, to));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.totalEvents).toBe(3);
  });

  it('forwards from and to dates to the repository', async () => {
    const repo = makeRepo(Ok(summary));
    const handler = await build(repo);

    await handler.execute(new GetDowntimeSummaryQuery(from, to));

    expect(repo.getDowntimeSummary).toHaveBeenCalledWith(from, to);
  });

  it('returns Err when repository fails', async () => {
    const repo = makeRepo(Err('db error'));
    const handler = await build(repo);

    const r = await handler.execute(new GetDowntimeSummaryQuery(from, to));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with zero counts when summary is empty', async () => {
    const empty: DowntimeSummary = {
      totalDowntimeHours: 0,
      totalDowntimeMinutes: 0,
      totalEvents: 0,
      topReasons: [],
      mostAffectedWorkCenter: null,
    };
    const repo = makeRepo(Ok(empty));
    const handler = await build(repo);

    const r = await handler.execute(new GetDowntimeSummaryQuery(from, to));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.totalEvents).toBe(0);
      expect(r.data.mostAffectedWorkCenter).toBeNull();
    }
  });
});
