/**
 * test/design/get-design-order.handler.spec.ts
 * Unit tests for GetDesignOrderHandler. IDesignRepo is mocked; DesignOrder is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetDesignOrderHandler } from '../../src/modules/design/application/queries/get-design-order.handler';
import { GetDesignOrderQuery } from '../../src/modules/design/application/queries/get-design-order.query';
import { DESIGN_REPO } from '../../src/modules/design/domain/repositories/i-design.repo';
import { DesignOrder } from '../../src/modules/design/domain/aggregates/design-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findBySalesOrderId: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findBySalesOrderId: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeOrder(): DesignOrder {
  return DesignOrder.create(1, 2, 'desc', 99);
}

describe('GetDesignOrderHandler', () => {
  let handler: GetDesignOrderHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetDesignOrderHandler,
        { provide: DESIGN_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetDesignOrderHandler);
  });

  it('returns Ok with the design order when repo returns the row', async () => {
    const o = makeOrder();
    repo.findById.mockResolvedValue(Ok(o));

    const r = await handler.execute(new GetDesignOrderQuery('id'));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe(o);
  });

  it('returns NOT_FOUND when repo returns null data', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new GetDesignOrderQuery('missing'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('propagates repo error when findById fails', async () => {
    repo.findById.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetDesignOrderQuery('id'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('queries repo with exactly the id passed in the query', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));

    await handler.execute(new GetDesignOrderQuery('exact-id-77'));

    expect(repo.findById).toHaveBeenCalledWith('exact-id-77');
  });
});
