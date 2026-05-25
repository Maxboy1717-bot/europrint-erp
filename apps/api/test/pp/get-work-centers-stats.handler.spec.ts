/**
 * test/pp/get-work-centers-stats.handler.spec.ts
 *
 * Unit tests for GetWorkCentersStatsHandler. Only the IWorkCenterRepository
 * is mocked.
 */

import { GetWorkCentersStatsHandler } from '../../src/modules/pp/application/queries/get-work-centers-stats.handler';
import { GetWorkCentersStatsQuery } from '../../src/modules/pp/application/queries/get-work-centers-stats.query';
import { Ok, Err } from '../../src/common/result';
import type {
  DrizzleWorkCenterRepository,
  WorkCenterStats,
} from '../../src/modules/pp/infrastructure/repositories/drizzle-work-center.repo';

type Repo = jest.Mocked<DrizzleWorkCenterRepository>;

function makeRepo(): Repo {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    getStats: jest.fn(),
  } as unknown as Repo;
}

const SAMPLE_STATS: WorkCenterStats = {
  total: 7,
  byType: { machine: 4, line: 2, manual: 1 },
  avgCostPerHour: 45_000,
  withLmsCertification: 3,
};

describe('GetWorkCentersStatsHandler', () => {
  it('returns Err when repo.getStats fails', async () => {
    const repo = makeRepo();
    repo.getStats.mockResolvedValue(Err('cannot compute'));
    const handler = new GetWorkCentersStatsHandler(repo);

    const r = await handler.execute(new GetWorkCentersStatsQuery());

    expect(r.ok).toBe(false);
  });

  it('returns Ok with full stats payload when repo succeeds', async () => {
    const repo = makeRepo();
    repo.getStats.mockResolvedValue(Ok(SAMPLE_STATS));
    const handler = new GetWorkCentersStatsHandler(repo);

    const r = await handler.execute(new GetWorkCentersStatsQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data?.total).toBe(7);
      expect(r.data?.byType).toEqual(SAMPLE_STATS.byType);
      expect(r.data?.avgCostPerHour).toBe(45_000);
    }
  });

  it('preserves zero-value stats from repository without coercion', async () => {
    const empty: WorkCenterStats = { total: 0, byType: {}, avgCostPerHour: 0, withLmsCertification: 0 };
    const repo = makeRepo();
    repo.getStats.mockResolvedValue(Ok(empty));
    const handler = new GetWorkCentersStatsHandler(repo);

    const r = await handler.execute(new GetWorkCentersStatsQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data?.total).toBe(0);
      expect(r.data?.byType).toEqual({});
    }
  });

  it('calls repo.getStats exactly once per execute invocation', async () => {
    const repo = makeRepo();
    repo.getStats.mockResolvedValue(Ok(SAMPLE_STATS));
    const handler = new GetWorkCentersStatsHandler(repo);

    await handler.execute(new GetWorkCentersStatsQuery());

    expect(repo.getStats).toHaveBeenCalledTimes(1);
  });
});
