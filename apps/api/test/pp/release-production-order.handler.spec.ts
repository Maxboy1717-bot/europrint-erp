/**
 * test/pp/release-production-order.handler.spec.ts
 *
 * Unit tests for ReleaseProductionOrderHandler. Repo + EventBus mocked.
 */

import { EventBus } from '@nestjs/cqrs';
import {
  ReleaseProductionOrderHandler,
  ReleaseProductionOrderCommand,
} from '../../src/modules/pp/application/commands/release-production-order.handler';
import {
  ProductionOrder,
  PoStatus,
  MaterialRequirement,
} from '../../src/modules/pp/domain/aggregates/production-order.aggregate';
import { PpReleasedEvent } from '../../src/modules/pp/domain/events/pp-released.event';
import { Ok, Err, AppErr } from '../../src/common/result';
import { IPpRepository } from '../../src/modules/pp/domain/repositories/pp.repository';
import { productionOrderFactory } from '../_fixtures/factories';

type Repo = jest.Mocked<IPpRepository>;

function makeRepo(): Repo {
  return {
    savePo: jest.fn().mockResolvedValue(Ok(1)),
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
    // EP-PP-091/124 lab-gate — default to an approved card so tests that don't care about
    // the gate (persistence-failure / happy-path) keep exercising the rest of the flow;
    // the lab-gate-specific tests below override this per-case.
    getLabApprovalStatus: jest.fn().mockResolvedValue(Ok({ cardExists: true, labApproved: true })),
  } as Repo;
}

function makeEventBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

function makePo(opts: { checkpoint: boolean; withMaterial?: boolean } = { checkpoint: true }): ProductionOrder {
  const f = productionOrderFactory();
  const po = new ProductionOrder(f.id, f.soId, f.bomId, f.routingId, f.plannedStart, f.plannedEnd);
  po.setCheckpointValidated(opts.checkpoint);
  if (opts.withMaterial) {
    po.addMaterialRequirement(new MaterialRequirement(101, 25));
  }
  return po;
}

describe('ReleaseProductionOrderHandler', () => {
  it('returns Err when production order does not exist', async () => {
    const repo = makeRepo();
    repo.getPo.mockResolvedValue(Err(AppErr('NOT_FOUND', 'missing')));
    const handler = new ReleaseProductionOrderHandler(repo, makeEventBus());

    const r = await handler.execute(new ReleaseProductionOrderCommand(1));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  // EP-PP-091/EP-PP-124 lab-gate: release must hard-block when the technology card for
  // the order's product is not LAB-approved — "sifat rejadan ustun" (EP-PP-123), no
  // "continue with warning" bypass (this replaces the old aggregate-flag-only test, which
  // no longer reflects how the handler decides checkpointValidated).
  it('returns Err (BUSINESS_RULE_VIOLATION) when technology card exists but is not LAB-approved', async () => {
    const po = makePo({ checkpoint: false });
    const repo = makeRepo();
    repo.getPo.mockResolvedValue(Ok(po));
    repo.getLabApprovalStatus.mockResolvedValue(Ok({ cardExists: true, labApproved: false }));
    const bus = makeEventBus();
    const handler = new ReleaseProductionOrderHandler(repo, bus);

    const r = await handler.execute(new ReleaseProductionOrderCommand(po.getId()));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(bus.publish).not.toHaveBeenCalled();
    expect(repo.savePo).not.toHaveBeenCalled();
  });

  it('returns Err (BUSINESS_RULE_VIOLATION) when no technology card exists for the product', async () => {
    const po = makePo({ checkpoint: false });
    const repo = makeRepo();
    repo.getPo.mockResolvedValue(Ok(po));
    repo.getLabApprovalStatus.mockResolvedValue(Ok({ cardExists: false, labApproved: false }));
    const bus = makeEventBus();
    const handler = new ReleaseProductionOrderHandler(repo, bus);

    const r = await handler.execute(new ReleaseProductionOrderCommand(po.getId()));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(bus.publish).not.toHaveBeenCalled();
    expect(repo.savePo).not.toHaveBeenCalled();
  });

  it('returns Err when persistence fails after release transition', async () => {
    const po = makePo({ checkpoint: true, withMaterial: true });
    const repo = makeRepo();
    repo.getPo.mockResolvedValue(Ok(po));
    repo.savePo.mockResolvedValue(Err(AppErr('DB_ERROR', 'fail')));
    const bus = makeEventBus();
    const handler = new ReleaseProductionOrderHandler(repo, bus);

    const r = await handler.execute(new ReleaseProductionOrderCommand(po.getId()));

    expect(r.ok).toBe(false);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('releases production order and publishes PP_RELEASED_TO_PRODUCTION event when valid', async () => {
    const po = makePo({ checkpoint: true, withMaterial: true });
    const repo = makeRepo();
    repo.getPo.mockResolvedValue(Ok(po));
    const bus = makeEventBus();
    const handler = new ReleaseProductionOrderHandler(repo, bus);

    const r = await handler.execute(new ReleaseProductionOrderCommand(po.getId()));

    expect(r.ok).toBe(true);
    expect(po.getStatus()).toBe(PoStatus.RELEASED_TO_PRODUCTION);
    expect(repo.savePo).toHaveBeenCalledWith(po);
    expect(bus.publish).toHaveBeenCalledWith(expect.any(PpReleasedEvent));
  });
});
