/**
 * test/pp/production-plan.handler.spec.ts
 *
 * Unit tests for ProductionPlanHandler. IPpRepository mocked.
 */

import {
  ProductionPlanHandler,
  ProductionPlanQuery,
} from '../../src/modules/pp/application/queries/production-plan.handler';
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

describe('ProductionPlanHandler', () => {
  const start = new Date('2026-06-01');
  const end = new Date('2026-06-30');

  it('returns Err when repository fails to load the plan', async () => {
    const repo = makeRepo();
    repo.getProductionPlan.mockResolvedValue(Err(AppErr('DB_ERROR', 'no data')));
    const handler = new ProductionPlanHandler(repo);

    const r = await handler.execute(new ProductionPlanQuery(start, end));

    expect(r.ok).toBe(false);
  });

  it('returns Ok with empty plan when no production orders fall in window', async () => {
    const repo = makeRepo();
    repo.getProductionPlan.mockResolvedValue(Ok([]));
    const handler = new ProductionPlanHandler(repo);

    const r = await handler.execute(new ProductionPlanQuery(start, end));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('returns Ok with plan rows when window matches scheduled orders', async () => {
    const rows = [{ orderId: 1, plannedStart: start }, { orderId: 2, plannedStart: end }];
    const repo = makeRepo();
    repo.getProductionPlan.mockResolvedValue(Ok(rows));
    const handler = new ProductionPlanHandler(repo);

    const r = await handler.execute(new ProductionPlanQuery(start, end));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });

  it('forwards start and end dates to the repository verbatim', async () => {
    const repo = makeRepo();
    repo.getProductionPlan.mockResolvedValue(Ok([]));
    const handler = new ProductionPlanHandler(repo);

    await handler.execute(new ProductionPlanQuery(start, end));

    expect(repo.getProductionPlan).toHaveBeenCalledWith(start, end);
  });
});
