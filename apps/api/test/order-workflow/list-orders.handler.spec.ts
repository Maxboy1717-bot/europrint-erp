/**
 * test/order-workflow/list-orders.handler.spec.ts
 * Unit tests for ListOrdersHandler. IOrderRepo is mocked; OrderAggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ListOrdersHandler, ListOrdersQuery } from '../../src/modules/order-workflow/application/queries/list-orders.handler';
import { ORDER_WF_REPO } from '../../src/modules/order-workflow/infrastructure/repositories/i-order.repo';
import { OrderAggregate } from '../../src/modules/order-workflow/domain/aggregates/order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock { save: jest.Mock; findById: jest.Mock; findAll: jest.Mock; }
function makeRepo(): RepoMock {
  return { save: jest.fn(), findById: jest.fn(), findAll: jest.fn() };
}

function makeOrder(id: string, salesManager: number | null = null): OrderAggregate {
  const r = OrderAggregate.create({
    id, orderNumber: `OW-${id}`, customerId: 5,
    totalAmount: 1_000_000, currency: 'UZS', assignedSalesManager: salesManager,
  });
  if (!r.ok) throw new Error('test setup');
  return r.data;
}

describe('ListOrdersHandler', () => {
  let handler: ListOrdersHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ListOrdersHandler,
        { provide: ORDER_WF_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(ListOrdersHandler);
  });

  it('scopes findAll by actorId when actorRole is SALES_MANAGER', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new ListOrdersQuery(undefined, undefined, 50, 0, 'SALES_MANAGER', 11));

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 11 }),
    );
  });

  it('omits actor scoping when actorRole is unknown role', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new ListOrdersQuery(undefined, undefined, 50, 0, 'DIRECTOR', 11));

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: undefined }),
    );
  });

  it('returns Ok with items mapped to OrderListItem when repo succeeds', async () => {
    const orders = [makeOrder('a'), makeOrder('b')];
    repo.findAll.mockResolvedValue(Ok({ items: orders, total: 2 }));

    const r = await handler.execute(new ListOrdersQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.items[0].id).toBe('a');
      expect(r.data.items[0].status).toBe('DRAFT');
      expect(r.data.total).toBe(2);
    }
  });

  it('propagates repo error when findAll fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new ListOrdersQuery());

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('passes status and customerId filters through to repo unchanged', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new ListOrdersQuery('PRICING', 99, 25, 50));

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PRICING', customerId: 99, limit: 25, offset: 50 }),
    );
  });
});
