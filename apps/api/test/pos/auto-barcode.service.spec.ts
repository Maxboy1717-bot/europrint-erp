/**
 * test/pos/auto-barcode.service.spec.ts
 *
 * C8.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): pos_barcode_print_queue's underlying base table
 * (barcode_print_queue) had no UNIQUE constraint on barcode — a random-suffix collision from
 * parallel Promise.all inserts would silently succeed, producing two rows sharing one barcode
 * that later scan to the wrong item. A live UNIQUE constraint now makes a collision surface as a
 * Postgres 23505 error; these tests prove AutoBarcodeService retries with a fresh barcode on that
 * specific error (bounded attempts), and does NOT retry on any other kind of failure.
 */

import { Ok, Err } from '../../src/common/result';
import { AutoBarcodeService } from '../../src/modules/pos/application/services/auto-barcode.service';
import { AutoBarcodeRepository } from '../../src/modules/pos/infrastructure/repositories/auto-barcode.repository';

const MOVEMENT = { id: 1, movement_type: 'EXTERNAL_IN', to_warehouse_id: 5 };
const LINE = { movementLineId: 10, materialCardId: 20, materialCode: 'PAPER001', batchNumber: 'B1', quantity: 3, unit: 'dona' };

function uniqueViolation() {
  return Err({ message: 'duplicate key value violates unique constraint', code: 'DB_ERROR' as const, details: { pgCode: '23505' } });
}
function otherFailure() {
  return Err({ message: 'connection reset', code: 'DB_ERROR' as const, details: { pgCode: '08006' } });
}

describe('AutoBarcodeService — C8.1 barcode collision retry', () => {
  let repo: jest.Mocked<Partial<AutoBarcodeRepository>>;
  let service: AutoBarcodeService;

  beforeEach(() => {
    repo = {
      findMovement: jest.fn().mockResolvedValue(Ok(MOVEMENT)),
      findLines: jest.fn().mockResolvedValue(Ok([LINE])),
      insertBarcode: jest.fn(),
    };
    service = new AutoBarcodeService(repo as AutoBarcodeRepository);
  });

  it('succeeds on first attempt when there is no collision', async () => {
    (repo.insertBarcode as jest.Mock).mockResolvedValueOnce(Ok(undefined));
    const result = await service.generateForMovement(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.created).toBe(1);
    expect(repo.insertBarcode).toHaveBeenCalledTimes(1);
  });

  it('retries with a fresh barcode on a 23505 unique-violation and succeeds', async () => {
    (repo.insertBarcode as jest.Mock)
      .mockResolvedValueOnce(uniqueViolation())
      .mockResolvedValueOnce(Ok(undefined));

    const result = await service.generateForMovement(1);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.created).toBe(1);
    expect(repo.insertBarcode).toHaveBeenCalledTimes(2);
    const firstBarcode = (repo.insertBarcode as jest.Mock).mock.calls[0][0].barcode;
    const secondBarcode = (repo.insertBarcode as jest.Mock).mock.calls[1][0].barcode;
    expect(firstBarcode).not.toBe(secondBarcode); // a fresh random suffix each attempt
  });

  it('gives up after exhausting retries when every attempt collides, without crashing', async () => {
    (repo.insertBarcode as jest.Mock).mockResolvedValue(uniqueViolation());

    const result = await service.generateForMovement(1);

    expect(result.ok).toBe(true); // generateForMovement itself never throws
    if (result.ok) expect(result.data.created).toBe(0); // but this line's barcode was never queued
    expect(repo.insertBarcode).toHaveBeenCalledTimes(3); // MAX_BARCODE_COLLISION_RETRIES
  });

  it('does not retry on a non-collision failure (different Postgres error code)', async () => {
    (repo.insertBarcode as jest.Mock).mockResolvedValue(otherFailure());

    const result = await service.generateForMovement(1);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.created).toBe(0);
    expect(repo.insertBarcode).toHaveBeenCalledTimes(1); // no retry loop for a non-collision error
  });
});
