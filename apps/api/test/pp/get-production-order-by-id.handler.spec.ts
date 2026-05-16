/**
 * test/pp/get-production-order-by-id.handler.spec.ts
 *
 * Unit tests for GetProductionOrderByIdHandler. Mocks `@shared/db` so the
 * chain ends with a thenable returned by `.limit()`.
 */

interface FakeRow { [k: string]: unknown }
let nextResult: FakeRow[] | (() => never) = [];

function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const passthrough = jest.fn().mockImplementation(() => chain);
  chain.select = passthrough;
  chain.from = passthrough;
  chain.where = passthrough;
  chain.limit = jest.fn().mockImplementation(() => {
    if (typeof nextResult === 'function') return Promise.reject(new Error('db-down'));
    return Promise.resolve(nextResult);
  });
  return chain;
}

jest.mock('@shared/db', () => ({
  db: makeChain(),
  production_orders: { id: 'id' },
}));

import { GetProductionOrderByIdHandler } from '../../src/modules/pp/application/queries/get-production-order-by-id.handler';
import { GetProductionOrderByIdQuery } from '../../src/modules/pp/application/queries/get-production-order-by-id.query';

describe('GetProductionOrderByIdHandler', () => {
  beforeEach(() => {
    nextResult = [];
  });

  it('returns NOT_FOUND when no row is returned for the id', async () => {
    nextResult = [];
    const handler = new GetProductionOrderByIdHandler();

    const r = await handler.execute(new GetProductionOrderByIdQuery(123));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('NOT_FOUND');
      expect(r.error.message).toMatch(/123/);
    }
  });

  it('returns Ok with the row data when a match exists', async () => {
    nextResult = [{ id: 'po-1', status: 'planned' }];
    const handler = new GetProductionOrderByIdHandler();

    const r = await handler.execute(new GetProductionOrderByIdQuery(1));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toBe('po-1');
  });

  it('returns DB_ERROR when db throws on query execution', async () => {
    nextResult = () => { throw new Error('connection reset'); };
    const handler = new GetProductionOrderByIdHandler();

    const r = await handler.execute(new GetProductionOrderByIdQuery(99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });

  it('preserves the requested id in the NOT_FOUND error message', async () => {
    nextResult = [];
    const handler = new GetProductionOrderByIdHandler();

    const r = await handler.execute(new GetProductionOrderByIdQuery(4242));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain('4242');
  });
});
