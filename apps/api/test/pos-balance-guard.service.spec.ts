/**
 * pos-balance-guard.service.spec.ts
 *
 * Unit tests for PosBalanceGuardService.
 * runQuery is mocked at the module level; no real DB is used.
 */

jest.mock('../src/shared/db', () => ({
  runQuery: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PosBalanceGuardService } from '../src/modules/pos/application/services/pos-balance-guard.service';
import { runQuery } from '../src/shared/db';

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mock a stock-balance row for checkLine() */
function mockStockRow(availableQty: number, materialType: 'asset' | 'consumable') {
  mockRunQuery.mockResolvedValueOnce({
    rows: [{ available_qty: String(availableQty), material_type: materialType }],
  } as never);
}

/** Mock an empty stock-balance row (material not found in stock) */
function mockEmptyStockRow() {
  mockRunQuery.mockResolvedValueOnce({ rows: [] } as never);
}

/** Mock DB error (rejected promise) for checkLine() */
function mockDbError(message = 'DB connection error') {
  mockRunQuery.mockRejectedValueOnce(new Error(message));
}

// For checkMovementLines: each line triggers TWO runQuery calls
// (1st: material_type lookup, 2nd: stock balance in checkLine)
function mockMovementLinePair(
  materialType: 'asset' | 'consumable',
  availableQty: number,
) {
  // First call: material_type lookup
  mockRunQuery.mockResolvedValueOnce({
    rows: [{ material_type: materialType }],
  } as never);
  // Second call: stock balance in checkLine
  mockRunQuery.mockResolvedValueOnce({
    rows: [{ available_qty: String(availableQty), material_type: materialType }],
  } as never);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PosBalanceGuardService', () => {
  let service: PosBalanceGuardService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PosBalanceGuardService],
    }).compile();

    service = module.get<PosBalanceGuardService>(PosBalanceGuardService);
  });

  // ─── checkLine() ──────────────────────────────────────────────────────────

  describe('checkLine()', () => {
    it('should BLOCK asset material when available_qty < required_qty', async () => {
      mockStockRow(5, 'asset');

      const result = await service.checkLine('WH-01', 100, 10, 'asset');

      expect(result.allowed).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.warning).toMatch(/100/); // materialCardId
    });

    it('should allow asset material when available_qty >= required_qty', async () => {
      mockStockRow(50, 'asset');

      const result = await service.checkLine('WH-01', 100, 50, 'asset');

      expect(result.allowed).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should WARN (not block) consumable material when available_qty < required_qty', async () => {
      mockStockRow(3, 'consumable');

      const result = await service.checkLine('WH-01', 200, 10, 'consumable');

      expect(result.allowed).toBe(true);   // allowed = true for consumable
      expect(result.warning).toBeDefined(); // but a warning is present
    });

    it('should allow consumable when sufficient stock', async () => {
      mockStockRow(100, 'consumable');

      const result = await service.checkLine('WH-01', 200, 50, 'consumable');

      expect(result.allowed).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should return correct remainingAfter value', async () => {
      mockStockRow(80, 'asset');

      const result = await service.checkLine('WH-01', 5, 30, 'asset');

      // 80 (available) - 30 (required) = 50
      expect(result.remainingAfter).toBe(50);
    });

    it('should return correct negative remainingAfter when insufficient', async () => {
      mockStockRow(5, 'asset');

      const result = await service.checkLine('WH-01', 5, 20, 'asset');

      // 5 - 20 = -15
      expect(result.remainingAfter).toBe(-15);
    });

    it('should BLOCK asset on DB error (fail-closed)', async () => {
      // Fail-CLOSED: a failed balance query means stock cannot be verified, so the
      // guard blocks the line rather than letting an unchecked movement through.
      mockDbError();

      const result = await service.checkLine('WH-01', 100, 10, 'asset');

      expect(result.allowed).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.remainingAfter).toBe(0);
    });

    it('should treat null available_qty as zero', async () => {
      mockRunQuery.mockResolvedValueOnce({
        rows: [{ available_qty: null, material_type: 'asset' }],
      } as never);

      const result = await service.checkLine('WH-01', 7, 5, 'asset');

      // 0 (null→0) < 5 (required) → blocked
      expect(result.allowed).toBe(false);
      expect(result.remainingAfter).toBe(-5);
    });

    it('should BLOCK consumable on DB error (fail-closed)', async () => {
      mockDbError();

      const result = await service.checkLine('WH-01', 300, 5, 'consumable');

      // Fail-CLOSED: even consumables are blocked when the balance cannot be verified.
      expect(result.allowed).toBe(false);
      expect(result.warning).toBeDefined();
    });
  });

  // ─── checkMovementLines() ─────────────────────────────────────────────────

  describe('checkMovementLines()', () => {
    it('should block if any ASSET line is insufficient', async () => {
      mockMovementLinePair('asset', 3); // available=3, needs 10 → block

      const result = await service.checkMovementLines([
        { warehouseId: 'WH-01', materialCardId: 1, quantity: 10 },
      ]);

      expect(result.ok).toBe(false);
      expect(result.blocks).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn if CONSUMABLE line is insufficient but no blocks', async () => {
      mockMovementLinePair('consumable', 2); // available=2, needs 5 → warn

      const result = await service.checkMovementLines([
        { warehouseId: 'WH-01', materialCardId: 2, quantity: 5 },
      ]);

      expect(result.ok).toBe(false);     // ok=false because warnings exist
      expect(result.blocks).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });

    it('should pass (ok=true) with overrideReason when only consumable warnings', async () => {
      mockMovementLinePair('consumable', 1); // shortage but consumable

      const result = await service.checkMovementLines(
        [{ warehouseId: 'WH-01', materialCardId: 3, quantity: 10 }],
        'Manager approved override',
      );

      // With overrideReason, consumable warnings are logged but not added to warnings[]
      expect(result.ok).toBe(true);
      expect(result.blocks).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should still block assets even with overrideReason', async () => {
      mockMovementLinePair('asset', 0); // asset, zero stock → block

      const result = await service.checkMovementLines(
        [{ warehouseId: 'WH-01', materialCardId: 4, quantity: 5 }],
        'Override supplied',
      );

      expect(result.ok).toBe(false);
      expect(result.blocks).toHaveLength(1);
    });

    it('should handle empty lines array', async () => {
      const result = await service.checkMovementLines([]);

      expect(result.ok).toBe(true);
      expect(result.blocks).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it('should accumulate multiple block messages', async () => {
      // Two asset lines, both insufficient
      mockMovementLinePair('asset', 0);
      mockMovementLinePair('asset', 1);

      const result = await service.checkMovementLines([
        { warehouseId: 'WH-01', materialCardId: 10, quantity: 50 },
        { warehouseId: 'WH-01', materialCardId: 11, quantity: 20 },
      ]);

      expect(result.blocks).toHaveLength(2);
      expect(result.ok).toBe(false);
    });

    it('should allow all lines when stock is sufficient', async () => {
      mockMovementLinePair('asset', 100);
      mockMovementLinePair('consumable', 200);

      const result = await service.checkMovementLines([
        { warehouseId: 'WH-01', materialCardId: 1, quantity: 10 },
        { warehouseId: 'WH-01', materialCardId: 2, quantity: 5 },
      ]);

      expect(result.ok).toBe(true);
      expect(result.blocks).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
