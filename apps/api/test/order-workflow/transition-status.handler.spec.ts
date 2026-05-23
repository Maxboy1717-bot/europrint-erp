/**
 * test/order-workflow/transition-status.handler.spec.ts
 * Unit tests for TransitionStatusHandler. `db` mocked at table level;
 * IOrderRepo is mocked; OrderAggregate / OrderStatusVo are real (FSM tested).
 */

jest.mock('@shared/db', () => {
  type Q = { where: jest.Mock; limit: jest.Mock; from: jest.Mock };
  const where = jest.fn().mockResolvedValue([]);
  const from = jest.fn(() => ({ where, limit: jest.fn().mockReturnThis() }));
  const select: jest.Mock = jest.fn(() => ({ from }));
  const update = jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn().mockResolvedValue(undefined) })) }));
  const insert = jest.fn(() => ({ values: jest.fn().mockResolvedValue(undefined) }));
  const tx = { update, insert };
  const db = {
    select, update, insert,
    transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  return {
    db,
    owOrders: {},
    owOrderStatusHistory: {},
    owPaymentPlanEntries: {},
    owMaterialRequirements: {},
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { TransitionStatusHandler, TransitionStatusCommand } from '../../src/modules/order-workflow/application/commands/transition-status.handler';
import { ORDER_WF_REPO } from '../../src/modules/order-workflow/infrastructure/repositories/i-order.repo';
import { OrderAggregate } from '../../src/modules/order-workflow/domain/aggregates/order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  save: jest.Mock; findById: jest.Mock; findAll: jest.Mock;
  persistStatusTransition: jest.Mock;
  findOrderGuardFields: jest.Mock;
  findPaymentPlanEntries: jest.Mock;
  findMaterialRequirements: jest.Mock;
}
function makeRepo(): RepoMock {
  return {
    save: jest.fn(), findById: jest.fn(), findAll: jest.fn(),
    persistStatusTransition: jest.fn().mockResolvedValue(Ok(undefined)),
    findOrderGuardFields: jest.fn(),
    findPaymentPlanEntries: jest.fn(),
    findMaterialRequirements: jest.fn(),
  };
}

function makeOrder(assignedSalesManager: number | null = null): OrderAggregate {
  const r = OrderAggregate.create({
    id: 'order-1', orderNumber: 'OW-1', customerId: 5,
    totalAmount: 1_000_000, currency: 'UZS', assignedSalesManager,
  });
  if (!r.ok) throw new Error('test setup');
  // Move to LEAD_INTAKE so further transitions are valid
  r.data.transition('LEAD_INTAKE');
  return r.data;
}

describe('TransitionStatusHandler', () => {
  let handler: TransitionStatusHandler;
  let repo: RepoMock;
  let publishSpy: jest.SpyInstance;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TransitionStatusHandler,
        { provide: ORDER_WF_REPO, useValue: repo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    handler = moduleRef.get(TransitionStatusHandler);
    publishSpy = jest.spyOn(moduleRef.get(EventBus), 'publish');
  });

  it('returns NOT_FOUND when order does not exist in repo', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(
      new TransitionStatusCommand('missing', 'PRICING', undefined, 1),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when actor is SALES_MANAGER but not assigned to order', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder(42)));

    const r = await handler.execute(
      new TransitionStatusCommand('order-1', 'PRICING', undefined, 7, 'SALES_MANAGER', 7),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
  });

  it('returns INVALID_TRANSITION when destination is not reachable from current status', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));

    const r = await handler.execute(
      new TransitionStatusCommand('order-1', 'SHIPPING', undefined, 1),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
  });

  it('returns Ok with new status and emits event when transition is valid', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));

    const r = await handler.execute(
      new TransitionStatusCommand('order-1', 'PRICING', 'reason', 1),
    );

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe('PRICING');
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({ toStatus: 'PRICING' }),
    );
  });

  it('returns DB_ERROR when underlying transaction rejects', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));
    repo.persistStatusTransition.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'tx down')));

    const r = await handler.execute(
      new TransitionStatusCommand('order-1', 'PRICING', 'r', 1),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('propagates repo error when findById fails', async () => {
    repo.findById.mockResolvedValue(Err(AppErr('DB_ERROR', 'connection lost')));

    const r = await handler.execute(
      new TransitionStatusCommand('order-1', 'PRICING', 'r', 1),
    );

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
