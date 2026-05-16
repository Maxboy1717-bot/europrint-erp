/**
 * test/sd/get-invoices.handler.spec.ts
 *
 * Unit tests for sd GetInvoicesHandler. The shared db module is mocked so the
 * pagination + filter wiring can be exercised without real DB access.
 */

jest.mock('@shared/db', () => {
  const offset = jest.fn();
  const rowsLimit = jest.fn().mockReturnValue({ offset });
  const where1 = jest.fn().mockReturnValue({ limit: rowsLimit });
  const from1  = jest.fn().mockReturnValue({ where: where1 });
  const where2 = jest.fn();
  const from2  = jest.fn().mockReturnValue({ where: where2 });

  let callCount = 0;
  const select = jest.fn().mockImplementation((cols?: unknown) => {
    callCount += 1;
    return cols ? { from: from2 } : { from: from1 };
  });
  return {
    db: { select },
    invoices: {
      id: 'invoices.id',
      sales_order_id: 'invoices.sales_order_id',
      status: 'invoices.status',
      created_at: 'invoices.created_at',
      deleted_at: 'invoices.deleted_at',
    },
    __chain: { select, offset, where2, get callCount() { return callCount; } },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { GetInvoicesHandler } from '../../src/modules/sd/application/queries/get-invoices.handler';
import { GetInvoicesQuery } from '../../src/modules/sd/application/queries/get-invoices.query';

const sharedDb = jest.requireMock('@shared/db') as {
  __chain: { offset: jest.Mock; where2: jest.Mock };
};
const { offset: dbOffset, where2: dbCountWhere } = sharedDb.__chain;

async function buildHandler(): Promise<GetInvoicesHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [GetInvoicesHandler],
  }).compile();
  return module.get(GetInvoicesHandler);
}

describe('GetInvoicesHandler (sd)', () => {
  beforeEach(() => {
    dbOffset.mockReset();
    dbCountWhere.mockReset();
  });

  it('returns paginated data with totalPages derived from total', async () => {
    dbOffset.mockResolvedValue([{ id: 'inv-1' }, { id: 'inv-2' }]);
    dbCountWhere.mockResolvedValue([{ count: 42 }]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoicesQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toHaveLength(2);
      expect(result.data.pagination['total']).toBe(42);
      expect(result.data.pagination['totalPages']).toBe(3); // 42/20 = 2.1 → ceil 3
    }
  });

  it('applies default page=1 and limit=20 when query is empty', async () => {
    dbOffset.mockResolvedValue([]);
    dbCountWhere.mockResolvedValue([{ count: 0 }]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoicesQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pagination['page']).toBe(1);
      expect(result.data.pagination['limit']).toBe(20);
    }
  });

  it('honours custom page and limit from query', async () => {
    dbOffset.mockResolvedValue([]);
    dbCountWhere.mockResolvedValue([{ count: 0 }]);
    const handler = await buildHandler();

    const result = await handler.execute(
      new GetInvoicesQuery(undefined, undefined, undefined, undefined, 5, 50),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pagination['page']).toBe(5);
      expect(result.data.pagination['limit']).toBe(50);
    }
  });

  it('returns empty list when no matching invoices exist', async () => {
    dbOffset.mockResolvedValue([]);
    dbCountWhere.mockResolvedValue([{ count: 0 }]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoicesQuery('999'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toEqual([]);
      expect(result.data.pagination['total']).toBe(0);
    }
  });

  it('coerces null count row to zero', async () => {
    dbOffset.mockResolvedValue([]);
    dbCountWhere.mockResolvedValue([]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoicesQuery());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.pagination['total']).toBe(0);
  });
});
