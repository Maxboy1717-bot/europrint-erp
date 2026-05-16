/**
 * test/order-workflow/get-order-saga.handler.spec.ts
 * Unit tests for GetOrderSagaHandler. `db.select` mocked at table level.
 * IOrderRepo is mocked; OrderAggregate is real.
 */

jest.mock('@shared/db', () => {
  const where = jest.fn().mockResolvedValue([]);
  const from = jest.fn(() => ({ where }));
  const select = jest.fn(() => ({ from }));
  return {
    db: { select },
    owMolds: {}, owCliches: {}, owMaterialRequirements: {},
    owOrderStatusHistory: {}, owPaymentPlanEntries: {},
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { GetOrderSagaHandler, GetOrderSagaQuery } from '../../src/modules/order-workflow/application/queries/get-order-saga.handler';
import { ORDER_WF_REPO } from '../../src/modules/order-workflow/infrastructure/repositories/i-order.repo';
import { OrderAggregate } from '../../src/modules/order-workflow/domain/aggregates/order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock { save: jest.Mock; findById: jest.Mock; findAll: jest.Mock; }
function makeRepo(): RepoMock {
  return { save: jest.fn(), findById: jest.fn(), findAll: jest.fn() };
}

function makeOrder(salesManager: number | null = null): OrderAggregate {
  const r = OrderAggregate.create({
    id: 'order-1', orderNumber: 'OW-1', customerId: 5,
    totalAmount: 1_000_000, currency: 'UZS', assignedSalesManager: salesManager,
  });
  if (!r.ok) throw new Error('test setup');
  return r.data;
}

describe('GetOrderSagaHandler', () => {
  let handler: GetOrderSagaHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrderSagaHandler,
        { provide: ORDER_WF_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetOrderSagaHandler);
  });

  it('returns NOT_FOUND when order does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new GetOrderSagaQuery('missing'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns FORBIDDEN when SALES_MANAGER queries another manager\'s order', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder(42)));

    const r = await handler.execute(new GetOrderSagaQuery('order-1', 'SALES_MANAGER', 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('FORBIDDEN');
  });

  it('returns Ok with three tracks (Mold/Cliché/Material) when order is accessible', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));

    const r = await handler.execute(new GetOrderSagaQuery('order-1'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tracks).toHaveLength(3);
      expect(r.data.tracks.map((t) => t.name)).toEqual(['Mold', 'Cliché', 'Material']);
    }
  });

  it('returns 0% progress on each track when underlying tables are empty', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));

    const r = await handler.execute(new GetOrderSagaQuery('order-1'));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tracks.every((t) => t.progressPct === 0)).toBe(true);
    }
  });

  it('propagates repo error when findById fails', async () => {
    repo.findById.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetOrderSagaQuery('order-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
