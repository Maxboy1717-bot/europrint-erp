/**
 * pos-fifo.service.spec.ts
 *
 * Unit tests for PosFifoService (FIFO / FEFO batch allocation).
 * All DB access is mocked via jest.fn() — no real database is used.
 */

// ─── Module-level mock (must be before any imports) ──────────────────────────
jest.mock('../src/shared/db', () => ({
  runQuery: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PosFifoService, BatchCandidate } from '../src/modules/pos/application/services/pos-fifo.service';
import { runQuery } from '../src/shared/db';

// Typed reference so TypeScript is happy in assertions
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBatch(overrides: Partial<BatchCandidate> = {}): BatchCandidate {
  return {
    batchId:      1,
    batchNumber:  'BATCH-001',
    warehouseId:  10,
    availableQty: 100,
    unitPrice:    5.0,
    expiryDate:   null,
    receivedDate: '2024-01-15',
    ...overrides,
  };
}

/**
 * Shorthand: first call to runQuery returns the "hasExpiry" lookup,
 * second call returns the batches list.
 */
function setupRunQueryMocks(hasExpiry: boolean, batches: BatchCandidate[]) {
  mockRunQuery
    .mockResolvedValueOnce({ rows: [{ has_expiry: hasExpiry }] } as never)
    .mockResolvedValueOnce({ rows: batches } as never);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PosFifoService', () => {
  let service: PosFifoService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PosFifoService],
    }).compile();

    service = module.get<PosFifoService>(PosFifoService);
  });

  // ─── getCandidates() ────────────────────────────────────────────────────────

  describe('getCandidates()', () => {
    it('should order by received_date ASC for non-expiry materials (FIFO)', async () => {
      const batches: BatchCandidate[] = [
        makeBatch({ batchId: 1, receivedDate: '2024-01-01', expiryDate: null }),
        makeBatch({ batchId: 2, receivedDate: '2024-03-01', expiryDate: null }),
      ];
      setupRunQueryMocks(false, batches);

      const result = await service.getCandidates(10, 42);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Verify the SQL fragment used FIFO ordering: runQuery called twice
      expect(mockRunQuery).toHaveBeenCalledTimes(2);

      // The second call (actual batch query) should contain "received_date ASC"
      const sqlArg = (mockRunQuery.mock.calls[1][0] as { queryChunks?: Array<{ value?: unknown[] }> });
      const queryString = JSON.stringify(sqlArg);
      expect(queryString).toContain('received_date ASC');
    });

    it('should order by expiry_date ASC for expiry materials (FEFO)', async () => {
      const batches: BatchCandidate[] = [
        makeBatch({ batchId: 1, expiryDate: '2024-06-01' }),
        makeBatch({ batchId: 2, expiryDate: '2024-12-01' }),
      ];
      setupRunQueryMocks(true, batches);

      const result = await service.getCandidates(10, 99);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const sqlArg = (mockRunQuery.mock.calls[1][0] as object);
      const queryString = JSON.stringify(sqlArg);
      expect(queryString).toContain('expiry_date ASC');
    });

    it('should exclude DEPLETED and EXPIRED batches (SQL filter on status = ACTIVE)', async () => {
      // The service filters in SQL; here we verify the query contains the correct condition
      setupRunQueryMocks(false, []);

      const result = await service.getCandidates(10, 1);

      expect(result.ok).toBe(true);
      const sqlArg = (mockRunQuery.mock.calls[1][0] as object);
      const queryString = JSON.stringify(sqlArg);
      expect(queryString).toContain('ACTIVE');
    });

    it('should exclude batches with zero quantity (SQL filter)', async () => {
      setupRunQueryMocks(false, []);

      await service.getCandidates(10, 1);

      const sqlArg = (mockRunQuery.mock.calls[1][0] as object);
      const queryString = JSON.stringify(sqlArg);
      // COALESCE(b.current_qty, 0) > 0
      expect(queryString).toContain('current_qty');
    });

    it('should return Ok with empty array when no candidates exist', async () => {
      setupRunQueryMocks(false, []);

      const result = await service.getCandidates(10, 1);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toEqual([]);
    });

    it('should return Err when the batch query DB throws', async () => {
      // hasExpiry call succeeds (catches internally and returns false)
      // but the second runQuery (batch list) rejects
      mockRunQuery
        .mockResolvedValueOnce({ rows: [{ has_expiry: false }] } as never) // hasExpiry OK
        .mockRejectedValueOnce(new Error('connection refused'));            // batch query fails

      const result = await service.getCandidates(10, 1);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('connection refused');
    });
  });

  // ─── allocate() ─────────────────────────────────────────────────────────────

  describe('allocate()', () => {
    it('should allocate from single batch when sufficient', async () => {
      const batches = [makeBatch({ batchId: 1, availableQty: 200, unitPrice: 10 })];
      setupRunQueryMocks(false, batches);

      const result = await service.allocate(10, 42, 50);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        batchId:      1,
        allocatedQty: 50,
        unitPrice:    10,
      });
    });

    it('should allocate across multiple batches (FIFO order)', async () => {
      const batches: BatchCandidate[] = [
        makeBatch({ batchId: 1, availableQty: 30, receivedDate: '2024-01-01' }),
        makeBatch({ batchId: 2, availableQty: 50, receivedDate: '2024-03-01' }),
        makeBatch({ batchId: 3, availableQty: 40, receivedDate: '2024-06-01' }),
      ];
      setupRunQueryMocks(false, batches);

      const result = await service.allocate(10, 42, 70);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ batchId: 1, allocatedQty: 30 });
      expect(result.data[1]).toMatchObject({ batchId: 2, allocatedQty: 40 });
    });

    it('should return error when insufficient stock', async () => {
      const batches = [makeBatch({ batchId: 1, availableQty: 20 })];
      setupRunQueryMocks(false, batches);

      const result = await service.allocate(10, 42, 100);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toMatch(/yetishmaydi|yetarli/i);
    });

    it('should allocate exactly the required quantity', async () => {
      const batches = [makeBatch({ batchId: 1, availableQty: 75 })];
      setupRunQueryMocks(false, batches);

      const result = await service.allocate(10, 42, 75);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data[0].allocatedQty).toBe(75);
      // Confirm no leftover allocation entries
      expect(result.data).toHaveLength(1);
    });

    it('FEFO: should prefer batch expiring sooner', async () => {
      // Batches returned in FEFO order (service sorts in SQL; we mimic that here)
      const batches: BatchCandidate[] = [
        makeBatch({ batchId: 10, availableQty: 20, expiryDate: '2024-06-01' }), // expires sooner
        makeBatch({ batchId: 11, availableQty: 50, expiryDate: '2024-12-01' }), // expires later
      ];
      setupRunQueryMocks(true, batches);

      const result = await service.allocate(10, 99, 25);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // First allocation must come from batch 10 (sooner expiry)
      expect(result.data[0].batchId).toBe(10);
      expect(result.data[0].allocatedQty).toBe(20);
      expect(result.data[1].batchId).toBe(11);
      expect(result.data[1].allocatedQty).toBe(5);
    });

    it('should propagate error when getCandidates fails', async () => {
      // Both calls to runQuery fail
      mockRunQuery.mockRejectedValueOnce(new Error('db error'));

      const result = await service.allocate(10, 42, 10);

      expect(result.ok).toBe(false);
    });
  });
});
