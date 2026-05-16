/**
 * test/sd/get-invoice.handler.spec.ts
 *
 * Unit tests for GetInvoiceHandler (sd). The shared db module is mocked to
 * avoid real DB access.
 */

jest.mock('@shared/db', () => {
  const limit = jest.fn();
  const where = jest.fn().mockReturnValue({ limit });
  const from  = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });
  return {
    db: { select },
    invoices: { id: 'invoices.id' },
    // expose for tests
    __chain: { select, from, where, limit },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { GetInvoiceHandler } from '../../src/modules/sd/application/queries/get-invoice.handler';
import { GetInvoiceQuery } from '../../src/modules/sd/application/queries/get-invoice.query';

// Pull mock chain handles via require so the typed import path stays clean.
type ChainMock = {
  __chain: { select: jest.Mock; from: jest.Mock; where: jest.Mock; limit: jest.Mock };
};
const sharedDb = jest.requireMock('@shared/db') as ChainMock;
const { limit: dbLimit } = sharedDb.__chain;

async function buildHandler(): Promise<GetInvoiceHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [GetInvoiceHandler],
  }).compile();
  return module.get(GetInvoiceHandler);
}

describe('GetInvoiceHandler (sd)', () => {
  beforeEach(() => {
    dbLimit.mockReset();
  });

  it('returns invoice row when one matches the query id', async () => {
    dbLimit.mockResolvedValue([{ id: 'inv-1', total_amount: '1000' }]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoiceQuery('inv-1'));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data['id']).toBe('inv-1');
  });

  it('returns NOT_FOUND when no row is returned', async () => {
    dbLimit.mockResolvedValue([]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoiceQuery('missing'));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('returns NOT_FOUND with descriptive message', async () => {
    dbLimit.mockResolvedValue([]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoiceQuery('xyz'));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/not found/i);
  });

  it('passes through arbitrary invoice columns into the result payload', async () => {
    dbLimit.mockResolvedValue([
      { id: 'inv-9', status: 'posted', customer_name: 'Acme' },
    ]);
    const handler = await buildHandler();

    const result = await handler.execute(new GetInvoiceQuery('inv-9'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data['status']).toBe('posted');
      expect(result.data['customer_name']).toBe('Acme');
    }
  });
});
