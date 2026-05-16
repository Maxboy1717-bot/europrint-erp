/**
 * test/pp/machine-load.handler.spec.ts
 *
 * Unit tests for MachineLoadHandler. IPpRepository mocked.
 */

import {
  MachineLoadHandler,
  MachineLoadQuery,
} from '../../src/modules/pp/application/queries/machine-load.handler';
import { Ok, Err, AppErr } from '../../src/common/result';
import type { IPpRepository } from '../../src/modules/pp/domain/repositories/pp.repository';

type Repo = jest.Mocked<IPpRepository>;

function makeRepo(): Repo {
  return {
    savePo: jest.fn(),
    getPo: jest.fn(),
    getAllPoByStatus: jest.fn(),
    saveBom: jest.fn(),
    getBom: jest.fn(),
    getBomByProductId: jest.fn(),
    saveRouting: jest.fn(),
    getRouting: jest.fn(),
    getRoutingByProductId: jest.fn(),
    unlockPlanning: jest.fn(),
    getProductionPlan: jest.fn(),
    getMachineLoad: jest.fn(),
  } as Repo;
}

describe('MachineLoadHandler', () => {
  it('returns Err when repo signals failure to load metrics', async () => {
    const repo = makeRepo();
    repo.getMachineLoad.mockResolvedValue(Err(AppErr('DB_ERROR', 'no rows')));
    const handler = new MachineLoadHandler(repo);

    const r = await handler.execute(new MachineLoadQuery(5));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('returns Ok with empty array when no jobs are scheduled on the work center', async () => {
    const repo = makeRepo();
    repo.getMachineLoad.mockResolvedValue(Ok([]));
    const handler = new MachineLoadHandler(repo);

    const r = await handler.execute(new MachineLoadQuery(2));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('returns Ok with load rows when work center has scheduled operations', async () => {
    const rows = [{ workCenterId: 3, loadPercent: 75 }, { workCenterId: 3, loadPercent: 90 }];
    const repo = makeRepo();
    repo.getMachineLoad.mockResolvedValue(Ok(rows));
    const handler = new MachineLoadHandler(repo);

    const r = await handler.execute(new MachineLoadQuery(3));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it('passes the workCenterId from the query straight to the repository', async () => {
    const repo = makeRepo();
    repo.getMachineLoad.mockResolvedValue(Ok([]));
    const handler = new MachineLoadHandler(repo);

    await handler.execute(new MachineLoadQuery(77));

    expect(repo.getMachineLoad).toHaveBeenCalledWith(77);
  });
});
