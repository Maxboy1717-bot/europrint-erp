/**
 * test/unit/shared/db/typed-execute.spec.ts
 *
 * Unit tests for typedExecute<T>. The helper wraps db.execute() and unwraps
 * `.rows` so callers don't need `as unknown as { rows: T[] }` casts.
 * We mock `@shared/db` (the schema barrel that exposes `db`) so the test
 * runs without a real database.
 */

import { sql } from 'drizzle-orm';

const executeMock = jest.fn<Promise<{ rows: unknown[] }>, [unknown]>();

jest.mock('../../../../src/shared/db/schema', () => ({
  db: { execute: (q: unknown) => executeMock(q) },
}));

import { typedExecute } from '../../../../src/shared/db/typed-execute';

interface Row {
  id: number;
  name: string;
}

describe('typedExecute<T>', () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it('returns typed rows array when db.execute resolves with rows', async () => {
    executeMock.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'alpha' },
        { id: 2, name: 'beta' },
      ],
    });
    const out = await typedExecute<Row>(sql`SELECT id, name FROM t`);
    expect(out).toHaveLength(2);
    expect(out[0]?.id).toBe(1);
    expect(out[1]?.name).toBe('beta');
  });

  it('returns empty array when db.execute resolves with no rows', async () => {
    executeMock.mockResolvedValueOnce({ rows: [] });
    const out = await typedExecute<Row>(sql`SELECT * FROM t WHERE 1 = 0`);
    expect(out).toEqual([]);
  });

  it('propagates rejection when db.execute throws', async () => {
    executeMock.mockRejectedValueOnce(new Error('connection refused'));
    await expect(typedExecute<Row>(sql`SELECT 1`)).rejects.toThrow('connection refused');
  });

  it('forwards the sql query to db.execute when called', async () => {
    executeMock.mockResolvedValueOnce({ rows: [] });
    const q = sql`SELECT 1`;
    await typedExecute<Row>(q);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledWith(q);
  });

  it('preserves row order when db.execute returns multiple rows', async () => {
    executeMock.mockResolvedValueOnce({
      rows: [
        { id: 3, name: 'c' },
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ],
    });
    const out = await typedExecute<Row>(sql`SELECT * FROM t`);
    expect(out.map((r) => r.id)).toEqual([3, 1, 2]);
  });

  it('returns rows unchanged when payload contains nullable fields', async () => {
    interface NullableRow {
      id: number;
      note: string | null;
    }
    executeMock.mockResolvedValueOnce({
      rows: [
        { id: 1, note: null },
        { id: 2, note: 'hello' },
      ],
    });
    const out = await typedExecute<NullableRow>(sql`SELECT * FROM t`);
    expect(out[0]?.note).toBeNull();
    expect(out[1]?.note).toBe('hello');
  });
});
