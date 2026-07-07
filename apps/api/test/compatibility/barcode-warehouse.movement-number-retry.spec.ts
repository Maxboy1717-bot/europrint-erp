/**
 * test/compatibility/barcode-warehouse.movement-number-retry.spec.ts
 *
 * C8.7 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): receive()/productionReceive() generated
 * movement_number via second-resolution TO_CHAR(NOW(),'YYYYMMDD-HH24MISS') — two concurrent
 * requests landing in the same second could compute the identical string.
 * pos_movements.movement_number already has a live UNIQUE constraint
 * (pos_movements_movement_number_key, verified live via `_audit/q.cjs`), so the pre-fix symptom
 * was a crash on collision (23505 propagating as an opaque error), not a silent duplicate.
 *
 * These tests prove BarcodeWarehouseCompatService.insertMovementWithRetry() (used by both
 * receive() and productionReceive()): succeeds on a normal single call, retries with a freshly
 * generated movement_number on a 23505 unique-violation and succeeds on the second attempt, and
 * does NOT retry on a non-collision failure.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  rawSql: jest.fn(),
}));

import { BarcodeWarehouseCompatService } from '../../src/modules/compatibility/barcode-warehouse.service';
import { rawSql } from '@shared/db';

function uniqueViolation() {
  const e = new Error('duplicate key value violates unique constraint "pos_movements_movement_number_key"');
  return Object.assign(e, { code: '23505' });
}
function otherFailure() {
  const e = new Error('connection reset');
  return Object.assign(e, { code: '08006' });
}

describe('BarcodeWarehouseCompatService — C8.7 movement_number collision retry', () => {
  let svc: BarcodeWarehouseCompatService;
  let genSpy: jest.SpyInstance;

  beforeEach(() => {
    (rawSql as jest.Mock).mockReset();
    svc = new BarcodeWarehouseCompatService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    genSpy = jest.spyOn(svc as any, 'generateMovementNumber');
  });

  afterEach(() => {
    genSpy.mockRestore();
  });

  it('receive(): succeeds on a normal single call', async () => {
    (rawSql as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 1, movement_number: 'RCV-X', status: 'pending' }],
    });

    const result = await svc.receive({ movementType: 'RECEIPT', lotNumber: 'L1' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 1, movement_number: 'RCV-X', status: 'pending' });
    expect(rawSql).toHaveBeenCalledTimes(1);
    expect(genSpy).toHaveBeenCalledTimes(1);
  });

  it('receive(): retries with a fresh movement_number on a 23505 collision and succeeds', async () => {
    (rawSql as jest.Mock)
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce({ rows: [{ id: 2, movement_number: 'RCV-Y', status: 'pending' }] });

    const result = await svc.receive({ movementType: 'RECEIPT', lotNumber: 'L1' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 2, movement_number: 'RCV-Y', status: 'pending' });
    expect(rawSql).toHaveBeenCalledTimes(2);
    // a fresh movement_number was generated for the retry, not the same doomed one reused
    expect(genSpy).toHaveBeenCalledTimes(2);
    expect(genSpy.mock.results[0].value).not.toBe(genSpy.mock.results[1].value);
  });

  it('receive(): does not retry on a non-collision error', async () => {
    (rawSql as jest.Mock).mockRejectedValueOnce(otherFailure());

    const result = await svc.receive({ movementType: 'RECEIPT', lotNumber: 'L1' });

    expect(result.ok).toBe(false);
    expect(rawSql).toHaveBeenCalledTimes(1);
    expect(genSpy).toHaveBeenCalledTimes(1);
  });

  it('productionReceive(): retries with a fresh movement_number on a 23505 collision and succeeds', async () => {
    (rawSql as jest.Mock)
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce({ rows: [{ id: 3, movement_number: 'PROD-RCV-Y', status: 'pending' }] });

    const result = await svc.productionReceive({ lotNumber: 'L1', notes: 'n' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 3, movement_number: 'PROD-RCV-Y', status: 'pending' });
    expect(rawSql).toHaveBeenCalledTimes(2);
    expect(genSpy).toHaveBeenCalledTimes(2);
    expect(genSpy.mock.results[0].value).not.toBe(genSpy.mock.results[1].value);
  });

  it('productionReceive(): does not retry on a non-collision error', async () => {
    (rawSql as jest.Mock).mockRejectedValueOnce(otherFailure());

    const result = await svc.productionReceive({ lotNumber: 'L1', notes: 'n' });

    expect(result.ok).toBe(false);
    expect(rawSql).toHaveBeenCalledTimes(1);
  });
});
