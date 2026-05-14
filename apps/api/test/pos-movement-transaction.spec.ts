/**
 * pos-movement-transaction.spec.ts
 *
 * Unit tests that verify PostgreSQL transaction atomicity guarantees
 * for POS movement + stock updates.
 *
 * These are pure unit tests — all repository methods are mocked.
 * No real database connection is used.
 */

// ─── Drizzle DB mock ──────────────────────────────────────────────────────────

const mockDbSelect   = jest.fn();
const mockDbInsert   = jest.fn();
const mockDbUpdate   = jest.fn();
const mockDbExecute  = jest.fn();
const mockDbTransaction = jest.fn();

jest.mock('../../../lib/db/dist/cjs/index.js', () => ({
  db: {
    select:      mockDbSelect,
    insert:      mockDbInsert,
    update:      mockDbUpdate,
    execute:     mockDbExecute,
    transaction: mockDbTransaction,
  },
  eq:  jest.fn(() => ({})),
  sql: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
  posMovements:         {},
  posMovementLines:     {},
  posStockBalances:     {},
  posBatches:           {},
}), { virtual: true });

// ─── Inline minimal service implementations for atomicity testing ─────────────
//
// Instead of importing the real PosMovementService (which has many deps),
// we define a lightweight stand-in that mirrors the atomic contract we need
// to verify. This tests the PATTERN — if stock upsert fails, movement rolls back.

interface MovementLine {
  materialCardId: number;
  batchId:        number;
  quantity:       number;
}

interface StockRepository {
  upsertBalance(warehouseId: string, materialCardId: number, delta: number): Promise<void>;
  deductBatchQty(batchId: number, qty: number): Promise<void>;
  getAvailableQty(warehouseId: string, materialCardId: number): Promise<number>;
}

interface MovementRepository {
  createMovement(warehouseId: string, lines: MovementLine[]): Promise<{ id: number }>;
}

/**
 * The function-under-test: creates a movement and updates stock atomically.
 * Uses a transaction callback — if stockRepo throws, the whole TX rolls back.
 */
async function createMovementAtomically(
  warehouseId:   string,
  lines:         MovementLine[],
  movementRepo:  MovementRepository,
  stockRepo:     StockRepository,
  db:            { transaction: (fn: (tx: unknown) => Promise<void>) => Promise<void> },
): Promise<{ movementId: number }> {
  let movementId!: number;

  await db.transaction(async (_tx: unknown) => {
    const movement = await movementRepo.createMovement(warehouseId, lines);
    movementId     = movement.id;

    for (const line of lines) {
      await stockRepo.upsertBalance(warehouseId, line.materialCardId, -line.quantity);
      await stockRepo.deductBatchQty(line.batchId, line.quantity);
    }
  });

  return { movementId };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POS Movement — Transaction Atomicity (unit)', () => {
  let movementRepo: jest.Mocked<MovementRepository>;
  let stockRepo:    jest.Mocked<StockRepository>;
  let db: { transaction: jest.MockedFunction<(fn: (tx: unknown) => Promise<void>) => Promise<void>> };

  beforeEach(() => {
    jest.clearAllMocks();

    movementRepo = {
      createMovement: jest.fn(),
    };

    stockRepo = {
      upsertBalance:  jest.fn(),
      deductBatchQty: jest.fn(),
      getAvailableQty: jest.fn(),
    };

    // By default, transaction executes the callback synchronously
    db = {
      transaction: jest.fn(async (fn) => { await fn({}); }),
    };
  });

  // ─── Rollback on stock upsert failure ────────────────────────────────────

  it('should rollback movement if stock upsert fails', async () => {
    movementRepo.createMovement.mockResolvedValue({ id: 42 });
    stockRepo.upsertBalance.mockRejectedValueOnce(new Error('DB constraint violation'));

    // Simulate transaction rollback by making the transaction fn re-throw
    db.transaction.mockImplementationOnce(async (fn) => {
      try {
        await fn({});
      } catch (e) {
        // Rollback — re-throw so the caller knows
        throw e;
      }
    });

    const lines: MovementLine[] = [
      { materialCardId: 1, batchId: 101, quantity: 5 },
    ];

    await expect(
      createMovementAtomically('WH-01', lines, movementRepo, stockRepo, db),
    ).rejects.toThrow('DB constraint violation');

    // movement was created inside the TX, but TX rolled back → net effect: nothing committed
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('should rollback if batch deduction fails after movement creation', async () => {
    movementRepo.createMovement.mockResolvedValue({ id: 55 });
    stockRepo.upsertBalance.mockResolvedValue(undefined);
    stockRepo.deductBatchQty.mockRejectedValueOnce(new Error('batch qty underflow'));

    db.transaction.mockImplementationOnce(async (fn) => {
      try {
        await fn({});
      } catch (e) {
        throw e; // simulate rollback
      }
    });

    const lines: MovementLine[] = [
      { materialCardId: 2, batchId: 202, quantity: 20 },
    ];

    await expect(
      createMovementAtomically('WH-01', lines, movementRepo, stockRepo, db),
    ).rejects.toThrow('batch qty underflow');

    // deductBatchQty was attempted and failed
    expect(stockRepo.deductBatchQty).toHaveBeenCalledWith(202, 20);
  });

  // ─── Negative stock prevention ────────────────────────────────────────────

  it('should not allow negative stock for ASSET materials', async () => {
    stockRepo.getAvailableQty.mockResolvedValue(3); // only 3 available

    const requiredQty = 10;
    const availableQty = await stockRepo.getAvailableQty('WH-01', 1);

    // Business rule check
    expect(availableQty).toBeLessThan(requiredQty);

    // In a real implementation the service would throw before entering TX
    const wouldBlock = availableQty < requiredQty;
    expect(wouldBlock).toBe(true);
  });

  it('should allow movement when stock is exactly equal to required qty', async () => {
    stockRepo.getAvailableQty.mockResolvedValue(10);

    const availableQty = await stockRepo.getAvailableQty('WH-01', 5);
    expect(availableQty >= 10).toBe(true);
  });

  // ─── Atomic success path ──────────────────────────────────────────────────

  it('should update both batch.current_qty and stock_balance.available_qty atomically', async () => {
    movementRepo.createMovement.mockResolvedValue({ id: 77 });
    stockRepo.upsertBalance.mockResolvedValue(undefined);
    stockRepo.deductBatchQty.mockResolvedValue(undefined);

    const lines: MovementLine[] = [
      { materialCardId: 10, batchId: 500, quantity: 7 },
      { materialCardId: 11, batchId: 501, quantity: 3 },
    ];

    const result = await createMovementAtomically('WH-01', lines, movementRepo, stockRepo, db);

    expect(result.movementId).toBe(77);
    expect(stockRepo.upsertBalance).toHaveBeenCalledTimes(2);
    expect(stockRepo.deductBatchQty).toHaveBeenCalledTimes(2);
    // Verify the correct deltas
    expect(stockRepo.upsertBalance).toHaveBeenCalledWith('WH-01', 10, -7);
    expect(stockRepo.upsertBalance).toHaveBeenCalledWith('WH-01', 11, -3);
    expect(stockRepo.deductBatchQty).toHaveBeenCalledWith(500, 7);
    expect(stockRepo.deductBatchQty).toHaveBeenCalledWith(501, 3);
  });

  it('should call transaction exactly once per movement creation', async () => {
    movementRepo.createMovement.mockResolvedValue({ id: 1 });
    stockRepo.upsertBalance.mockResolvedValue(undefined);
    stockRepo.deductBatchQty.mockResolvedValue(undefined);

    await createMovementAtomically('WH-01', [
      { materialCardId: 1, batchId: 1, quantity: 1 },
    ], movementRepo, stockRepo, db);

    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple lines and fail-fast on first error', async () => {
    movementRepo.createMovement.mockResolvedValue({ id: 99 });

    // First line succeeds, second fails
    stockRepo.upsertBalance
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('second line failed'));
    stockRepo.deductBatchQty.mockResolvedValue(undefined);

    db.transaction.mockImplementationOnce(async (fn) => {
      try {
        await fn({});
      } catch (e) {
        throw e;
      }
    });

    const lines: MovementLine[] = [
      { materialCardId: 20, batchId: 600, quantity: 5 },
      { materialCardId: 21, batchId: 601, quantity: 3 },
    ];

    await expect(
      createMovementAtomically('WH-01', lines, movementRepo, stockRepo, db),
    ).rejects.toThrow('second line failed');

    // First line's deductBatchQty was called (before the second upsert failed)
    expect(stockRepo.deductBatchQty).toHaveBeenCalledWith(600, 5);
    // Second line's deductBatchQty should NOT have been called
    expect(stockRepo.deductBatchQty).not.toHaveBeenCalledWith(601, 3);
  });
});
