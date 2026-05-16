/**
 * test/mm/get-vendors.handler.spec.ts
 *
 * Unit tests for GetVendorsHandler. The drizzle builder chain is mocked
 * at the module boundary.
 */

interface VendorRow {
  id: number;
  name: string;
  tin: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  payment_terms: string | null;
  rating: number;
  is_active: boolean;
  created_at: Date;
}

const listChain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockResolvedValue([]),
};
const countChain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([{ count: 0 }]),
};

const eqMock = jest.fn().mockReturnValue({ __eq: true });

jest.mock('@shared/db', () => ({
  db: {
    select: jest.fn().mockImplementation((shape?: unknown) => {
      if (shape && typeof shape === 'object' && 'count' in (shape as Record<string, unknown>)) {
        return countChain;
      }
      return listChain;
    }),
  },
  vendors: {
    id: { name: 'id' },
    name: { name: 'name' },
    tin: { name: 'tin' },
    phone: { name: 'phone' },
    email: { name: 'email' },
    address: { name: 'address' },
    payment_terms: { name: 'payment_terms' },
    rating: { name: 'rating' },
    is_active: { name: 'is_active' },
    created_at: { name: 'created_at' },
  },
  runQuery: jest.fn(),
}));

jest.mock('drizzle-orm', () => ({
  eq: (col: { name: string }, val: unknown): unknown => eqMock(col, val),
  count: jest.fn().mockReturnValue({ __count: true }),
}));

import { Test } from '@nestjs/testing';
import { GetVendorsHandler } from '../../src/modules/mm/application/queries/get-vendors.handler';
import { GetVendorsQuery } from '../../src/modules/mm/application/queries/get-vendors.query';

function setList(rows: VendorRow[]): void { listChain.offset.mockResolvedValueOnce(rows); }
function setCount(value: number): void { countChain.where.mockResolvedValueOnce([{ count: value }]); }

describe('GetVendorsHandler', () => {
  let handler: GetVendorsHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    eqMock.mockClear();
    const moduleRef = await Test.createTestingModule({
      providers: [GetVendorsHandler],
    }).compile();
    handler = moduleRef.get(GetVendorsHandler);
  });

  it('returns ok with items and total when no filter provided', async () => {
    setList([]);
    setCount(3);

    const r = await handler.execute(new GetVendorsQuery());

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toEqual([]);
      expect(r.data.total).toBe(3);
    }
  });

  it('applies isActive=true filter via eq() condition', async () => {
    setList([]);
    setCount(0);

    await handler.execute(new GetVendorsQuery(true));

    expect(eqMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'is_active' }),
      true,
    );
  });

  it('returns total 0 when count row is missing', async () => {
    setList([]);
    countChain.where.mockResolvedValueOnce([]);

    const r = await handler.execute(new GetVendorsQuery());

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.total).toBe(0);
  });

  it('respects page+limit by hitting limit/offset on list chain', async () => {
    setList([]);
    setCount(0);

    await handler.execute(new GetVendorsQuery(undefined, 3, 5));

    expect(listChain.limit).toHaveBeenCalledWith(5);
    expect(listChain.offset).toHaveBeenCalledWith((3 - 1) * 5);
  });

  it('returns items unchanged when database row passes through', async () => {
    const rows: VendorRow[] = [{
      id: 1, name: 'V1', tin: '123', phone: null, email: null,
      address: null, payment_terms: null, rating: 4, is_active: true,
      created_at: new Date('2026-01-01'),
    }];
    setList(rows);
    setCount(1);

    const r = await handler.execute(new GetVendorsQuery());

    if (r.ok) expect(r.data.items).toEqual(rows);
  });
});
