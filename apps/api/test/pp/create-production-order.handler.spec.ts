/**
 * test/pp/create-production-order.handler.spec.ts
 *
 * Unit tests for CreateProductionOrderHandler. Repo + EventBus mocked, Bom
 * aggregate constructed real.
 */

import { EventBus } from '@nestjs/cqrs';
import {
  CreateProductionOrderHandler,
  CreateProductionOrderCommand,
} from '../../src/modules/pp/application/commands/create-production-order.handler';
import { Bom, BomItem } from '../../src/modules/pp/domain/aggregates/bom.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { IPpRepository } from '../../src/modules/pp/domain/repositories/pp.repository';
import { bomFactory, productionOrderFactory } from '../_fixtures/factories';

type Repo = jest.Mocked<IPpRepository>;

function makeRepo(): Repo {
  return {
    savePo: jest.fn().mockResolvedValue(Ok(123)),
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

function makeEventBus(): jest.Mocked<EventBus> {
  return { publish: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

function makeApprovedBomWithItems(): Bom {
  const f = bomFactory();
  const bom = new Bom(f.id, f.productId, f.version);
  bom.addItem(new BomItem(11, 100, 0));
  bom.addItem(new BomItem(22, 50, 10));
  bom.approve(7);
  return bom;
}

function makeCmd(overrides: Partial<CreateProductionOrderCommand> = {}): CreateProductionOrderCommand {
  const po = productionOrderFactory();
  const base = new CreateProductionOrderCommand(
    po.soId,
    po.bomId,
    po.routingId,
    po.plannedStart,
    po.plannedEnd,
    true,
  );
  return Object.assign(base, overrides);
}

describe('CreateProductionOrderHandler', () => {
  it('returns Err when three-checkpoint validation has not passed', async () => {
    const handler = new CreateProductionOrderHandler(makeRepo(), makeEventBus());

    const r = await handler.execute(makeCmd({ checkpointValidated: false }));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/checkpoint/i);
  });

  it('returns NOT_FOUND when bom is missing for given bomId', async () => {
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Err(AppErr('NOT_FOUND', 'no bom')));
    const handler = new CreateProductionOrderHandler(repo, makeEventBus());

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    expect(repo.savePo).not.toHaveBeenCalled();
  });

  it('returns Err when repo.savePo fails to persist the production order', async () => {
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Ok(makeApprovedBomWithItems()));
    repo.savePo.mockResolvedValue(Err(AppErr('DB_ERROR', 'insert fail')));
    const handler = new CreateProductionOrderHandler(repo, makeEventBus());

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('creates production order with MRP requirements derived from BOM items', async () => {
    const repo = makeRepo();
    repo.getBom.mockResolvedValue(Ok(makeApprovedBomWithItems()));
    const handler = new CreateProductionOrderHandler(repo, makeEventBus());

    const r = await handler.execute(makeCmd());

    expect(r.ok).toBe(true);
    expect(repo.savePo).toHaveBeenCalledTimes(1);
    const saved = repo.savePo.mock.calls[0][0];
    expect(saved.getMaterialList()).toHaveLength(2);
    expect(saved.getMaterialList().map((m) => m.materialId).sort()).toEqual([11, 22]);
    // Net quantity for materialId=22: 50 * (1 + 10/100) = 55
    const m22 = saved.getMaterialList().find((m) => m.materialId === 22);
    expect(m22?.quantity).toBeCloseTo(55, 5);
  });
});
