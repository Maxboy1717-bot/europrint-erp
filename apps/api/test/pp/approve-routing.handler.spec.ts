/**
 * test/pp/approve-routing.handler.spec.ts
 *
 * Unit tests for ApproveRoutingHandler. Only IPpRepository is mocked.
 */

import {
  ApproveRoutingHandler,
  ApproveRoutingCommand,
} from '../../src/modules/pp/application/commands/approve-routing.handler';
import {
  Routing,
  RoutingStatus,
  Operation,
} from '../../src/modules/pp/domain/aggregates/routing.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { IPpRepository } from '../../src/modules/pp/domain/repositories/pp.repository';
import { routingFactory } from '../_fixtures/factories';

type Repo = jest.Mocked<IPpRepository>;

function makeRepo(): Repo {
  return {
    savePo: jest.fn(),
    getPo: jest.fn(),
    getAllPoByStatus: jest.fn(),
    saveBom: jest.fn(),
    getBom: jest.fn(),
    getBomByProductId: jest.fn(),
    saveRouting: jest.fn().mockResolvedValue(Ok(1)),
    getRouting: jest.fn(),
    getRoutingByProductId: jest.fn(),
    unlockPlanning: jest.fn(),
    getProductionPlan: jest.fn(),
    getMachineLoad: jest.fn(),
  } as Repo;
}

function makeDraftRouting(): Routing {
  const f = routingFactory();
  const r = new Routing(f.id, f.productId, f.version);
  r.addOperation(new Operation(10, 1, 60, 5));
  return r;
}

describe('ApproveRoutingHandler', () => {
  it('returns Err when routing not found in repo', async () => {
    const repo = makeRepo();
    repo.getRouting.mockResolvedValue(Err(AppErr('NOT_FOUND', 'missing')));
    const handler = new ApproveRoutingHandler(repo);

    const r = await handler.execute(new ApproveRoutingCommand(99, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.saveRouting).not.toHaveBeenCalled();
  });

  it('returns Err when routing has zero operations on approve', async () => {
    const f = routingFactory();
    const empty = new Routing(f.id, f.productId, f.version);
    const repo = makeRepo();
    repo.getRouting.mockResolvedValue(Ok(empty));
    const handler = new ApproveRoutingHandler(repo);

    const r = await handler.execute(new ApproveRoutingCommand(f.id, 7));

    expect(r.ok).toBe(false);
    expect(repo.saveRouting).not.toHaveBeenCalled();
  });

  it('returns Err when repo.saveRouting fails after approval', async () => {
    const routing = makeDraftRouting();
    const repo = makeRepo();
    repo.getRouting.mockResolvedValue(Ok(routing));
    repo.saveRouting.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const handler = new ApproveRoutingHandler(repo);

    const r = await handler.execute(new ApproveRoutingCommand(routing.getId(), 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('approves routing and persists when a valid draft routing exists', async () => {
    const routing = makeDraftRouting();
    const repo = makeRepo();
    repo.getRouting.mockResolvedValue(Ok(routing));
    const handler = new ApproveRoutingHandler(repo);

    const r = await handler.execute(new ApproveRoutingCommand(routing.getId(), 42));

    expect(r.ok).toBe(true);
    expect(routing.getStatus()).toBe(RoutingStatus.APPROVED);
    expect(repo.saveRouting).toHaveBeenCalledWith(routing);
  });

  it('rejects re-approval of an already approved routing', async () => {
    const routing = makeDraftRouting();
    routing.approve(11);
    const repo = makeRepo();
    repo.getRouting.mockResolvedValue(Ok(routing));
    const handler = new ApproveRoutingHandler(repo);

    const r = await handler.execute(new ApproveRoutingCommand(routing.getId(), 99));

    expect(r.ok).toBe(false);
    expect(repo.saveRouting).not.toHaveBeenCalled();
  });
});
