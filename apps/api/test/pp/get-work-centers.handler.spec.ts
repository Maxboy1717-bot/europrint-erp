/**
 * test/pp/get-work-centers.handler.spec.ts
 *
 * Unit tests for GetWorkCentersHandler. Only the IWorkCenterRepository is
 * mocked; the WorkCenter aggregate (data-class) is constructed real.
 */

import { GetWorkCentersHandler } from '../../src/modules/pp/application/queries/get-work-centers.handler';
import { GetWorkCentersQuery } from '../../src/modules/pp/application/queries/get-work-centers.query';
import { WorkCenter, WorkCenterType } from '../../src/modules/pp/domain/aggregates/work-center.aggregate';
import { Ok, Err } from '../../src/common/result';
import type { DrizzleWorkCenterRepository } from '../../src/modules/pp/infrastructure/repositories/drizzle-work-center.repo';

type Repo = jest.Mocked<DrizzleWorkCenterRepository>;

function makeRepo(): Repo {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    getStats: jest.fn(),
  } as unknown as Repo;
}

function makeWc(id: string, type: WorkCenterType = WorkCenterType.MACHINE): WorkCenter {
  return new WorkCenter(id, `WC-${id}`, `Center ${id}`, type, 8, 50_000, null, 'Production', true, new Date('2026-01-01'), new Date('2026-01-02'));
}

describe('GetWorkCentersHandler', () => {
  it('returns Err when underlying repository fails', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Err('db dead'));
    const handler = new GetWorkCentersHandler(repo);

    const r = await handler.execute(new GetWorkCentersQuery({}));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with empty array when no work centers match filters', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Ok([]));
    const handler = new GetWorkCentersHandler(repo);

    const r = await handler.execute(new GetWorkCentersQuery({ isActive: true }));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('returns Ok with WorkCenter list when repo returns matches', async () => {
    const wcs = [makeWc('1'), makeWc('2', WorkCenterType.LINE)];
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Ok(wcs));
    const handler = new GetWorkCentersHandler(repo);

    const r = await handler.execute(new GetWorkCentersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(2);
      expect(r.data[0]).toBeInstanceOf(WorkCenter);
    }
  });

  it('forwards filters such as type to the repository unchanged', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(Ok([]));
    const handler = new GetWorkCentersHandler(repo);
    const filters = { type: WorkCenterType.MANUAL, department: 'QC' };

    await handler.execute(new GetWorkCentersQuery(filters));

    expect(repo.findAll).toHaveBeenCalledWith(filters);
  });
});
