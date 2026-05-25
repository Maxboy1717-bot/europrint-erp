/**
 * test/logistics/get-deliveries.handler.spec.ts
 * Unit tests for GetDeliveriesHandler. IDeliveryRepo is mocked; Delivery aggregate real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetDeliveriesHandler } from '../../src/modules/logistics/application/queries/get-deliveries.handler';
import { GetDeliveriesQuery } from '../../src/modules/logistics/application/queries/get-deliveries.query';
import { DELIVERY_REPO } from '../../src/modules/logistics/domain/repositories/i-delivery.repo';
import { Delivery } from '../../src/modules/logistics/domain/aggregates/delivery.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { deliveryFactory } from '../_fixtures/factories';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findBySalesOrderId: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findBySalesOrderId: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeDelivery(): Delivery {
  const f = deliveryFactory();
  return Delivery.createForSalesOrder(f.customerName, f.deliveryAddress);
}

describe('GetDeliveriesHandler', () => {
  let handler: GetDeliveriesHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetDeliveriesHandler,
        { provide: DELIVERY_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetDeliveriesHandler);
  });

  it('returns Ok with PaginatedResult when repo returns deliveries', async () => {
    const items = [makeDelivery(), makeDelivery(), makeDelivery()];
    repo.findAll.mockResolvedValue(Ok({ items, total: 3 }));

    const r = await handler.execute(new GetDeliveriesQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(3);
      expect(r.data.total).toBe(3);
    }
  });

  it('defaults page=1 and limit=10 when filters omit pagination', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    const r = await handler.execute(new GetDeliveriesQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('passes status + driverId + pagination filters through unchanged', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetDeliveriesQuery({
      status: 'in_transit', driverId: 'd-1', page: 3, limit: 20,
    }));

    expect(repo.findAll).toHaveBeenCalledWith({
      status: 'in_transit', driverId: 'd-1', page: 3, limit: 20,
    });
  });

  it('propagates repo error when findAll fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetDeliveriesQuery({}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
