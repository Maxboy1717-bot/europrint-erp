/**
 * test/pos/pos-movement-status.decrement-stock-guard.spec.ts
 *
 * VISION-3340 #57: execCurrentStockDecrement() (queries-remaining-a.ts) wrote an UNCONDITIONAL
 * UPDATE floored at 0 via `GREATEST(0, quantity - qty)` — no pre-check, no guard at all. An
 * overdraw (qty > available_quantity) silently succeeded and just clamped the balance to 0,
 * instead of failing — unlike WMS's own properly-guarded issue path
 * (execIssueFromWarehouseStock, queries-wms.ts: `WHERE ... AND available_quantity >= amount
 * RETURNING id`).
 *
 * Fixed to mirror execIssueFromWarehouseStock exactly: a guarded conditional UPDATE with
 * `available_quantity >= qty` and `RETURNING id`, reporting `true`/`false` (row updated or not)
 * instead of silently returning `void`. `PosMovementStatusRepository.decrementStock()` now
 * surfaces a `false` guard result as `Err(INSUFFICIENT_STOCK)` instead of discarding it and
 * always returning `Ok()`.
 *
 * This spec proves both layers:
 *   1. execCurrentStockDecrement() emits the guarded SQL (not GREATEST) and returns a boolean.
 *   2. PosMovementStatusRepository.decrementStock() maps that boolean to Result<void> correctly.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

// ─── Layer 1: execCurrentStockDecrement (queries-remaining-a.ts) ────────────

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args), db: {} }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  eq: jest.fn(), and: jest.fn(), ilike: jest.fn(), inArray: jest.fn(),
}));

import { execCurrentStockDecrement } from '../../src/common/database/queries-remaining-a';

describe('execCurrentStockDecrement — VISION-3340 #57 guarded conditional UPDATE', () => {
  beforeEach(() => {
    mockRunQuery.mockReset();
  });

  it('writes a guarded UPDATE (available_quantity >= qty ... RETURNING id), not an unconditional GREATEST(0,...) floor', async () => {
    mockRunQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    await execCurrentStockDecrement(7, 5, 30);

    expect(mockRunQuery).toHaveBeenCalledTimes(1);
    const text = sqlText(mockRunQuery.mock.calls[0][0]);
    expect(text).toContain('available_quantity >=');
    expect(text).toContain('RETURNING id');
    expect(text).not.toContain('GREATEST');
  });

  it('returns true when the guard passes (row updated)', async () => {
    mockRunQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await execCurrentStockDecrement(7, 5, 30);

    expect(result).toBe(true);
  });

  it('returns false (0 rows, no write happened) when the guard fails — overdraw no longer silently floors to 0', async () => {
    mockRunQuery.mockResolvedValue({ rows: [] });

    const result = await execCurrentStockDecrement(7, 5, 9999);

    expect(result).toBe(false);
  });
});

// ─── Layer 2: PosMovementStatusRepository.decrementStock() ──────────────────

jest.mock('@workspace/db', () => ({
  db: {}, eq: jest.fn(), sql: jest.fn(),
  posMovements: {}, posMovementLines: {}, posMovementTypes: {}, materialCards: {},
}));

const mockExecCurrentStockDecrement = jest.fn();
const mockExecCurrentStockUpsert = jest.fn();
jest.mock('@common/database/queries-remaining', () => ({
  execCurrentStockDecrement: (...args: unknown[]) => mockExecCurrentStockDecrement(...args),
  execCurrentStockUpsert: (...args: unknown[]) => mockExecCurrentStockUpsert(...args),
}));

import { PosMovementStatusRepository } from '../../src/modules/pos/infrastructure/repositories/pos-movement-status.repository';

describe('PosMovementStatusRepository.decrementStock — VISION-3340 #57', () => {
  let repo: PosMovementStatusRepository;

  beforeEach(() => {
    mockExecCurrentStockDecrement.mockReset();
    mockExecCurrentStockUpsert.mockReset();
    repo = new PosMovementStatusRepository();
  });

  it('returns Ok() when execCurrentStockDecrement reports the guard passed (true)', async () => {
    mockExecCurrentStockDecrement.mockResolvedValue(true);

    const result = await repo.decrementStock(7, 5, 30);

    expect(result.ok).toBe(true);
  });

  it('returns Err(INSUFFICIENT_STOCK) when execCurrentStockDecrement reports the guard failed (false) — no longer silently Ok()', async () => {
    mockExecCurrentStockDecrement.mockResolvedValue(false);

    const result = await repo.decrementStock(7, 5, 9999);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INSUFFICIENT_STOCK');
    }
  });
});
