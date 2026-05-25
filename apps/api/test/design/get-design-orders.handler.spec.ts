/**
 * test/design/get-design-orders.handler.spec.ts
 * Unit tests for GetDesignOrdersHandler. IDesignRepo is mocked; DesignOrder is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetDesignOrdersHandler } from '../../src/modules/design/application/queries/get-design-orders.handler';
import { GetDesignOrdersQuery } from '../../src/modules/design/application/queries/get-design-orders.query';
import { DESIGN_REPO } from '../../src/modules/design/domain/repositories/i-design.repo';
import { DesignOrder } from '../../src/modules/design/domain/aggregates/design-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findBySalesOrderId: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findBySalesOrderId: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeOrder(): DesignOrder { return DesignOrder.create(1, 2, 'd', 1); }

describe('GetDesignOrdersHandler', () => {
  let handler: GetDesignOrdersHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetDesignOrdersHandler,
        { provide: DESIGN_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetDesignOrdersHandler);
  });

  it('returns Ok with PaginatedResult when repo returns orders', async () => {
    const items = [makeOrder(), makeOrder()];
    repo.findAll.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetDesignOrdersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('defaults page=1 and limit=10 when filters omit pagination', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    const r = await handler.execute(new GetDesignOrdersQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('passes status + assignedTo + pagination filters through unchanged', async () => {
    repo.findAll.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetDesignOrdersQuery({
      status: 'review', assignedTo: 'u1', page: 2, limit: 25,
    }));

    expect(repo.findAll).toHaveBeenCalledWith({
      status: 'review', assignedTo: 'u1', page: 2, limit: 25,
    });
  });

  it('propagates repo error when findAll fails', async () => {
    repo.findAll.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetDesignOrdersQuery({}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
