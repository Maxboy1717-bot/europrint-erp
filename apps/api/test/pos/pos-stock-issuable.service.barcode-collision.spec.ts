/**
 * test/pos/pos-stock-issuable.service.barcode-collision.spec.ts
 *
 * C8.2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): _allocateUniqueBarcode()'s
 * COUNT(*)+1-then-barcodeExists()-check is itself TOCTOU-racy — two concurrent
 * generateInboundBarcode() calls can both see the same candidate as free and both attempt to
 * insert it. The live UNIQUE constraint added on barcode_print_queue.barcode (paired migration)
 * is what actually catches a collision; these tests prove generateInboundBarcode() retries the
 * whole allocate+insert cycle on a 23505 from insertGeneratedBarcode(), and does NOT retry any
 * other kind of failure.
 */

import { Ok, Err } from '../../src/common/result';
import { PosStockIssuableService } from '../../src/modules/pos/application/services/pos-stock-issuable.service';
import { PosStockIssuableRepository } from '../../src/modules/pos/infrastructure/repositories/pos-stock-issuable.repository';

const CFG = { warehouseId: 5, warehouseCode: 'RM-MAIN', warehouseName: 'Main', type: 'raw', labelTemplate: 'standard', unitBasis: null };
const MAT = { id: 20, kod: 'PAPER001', name: 'Paper', nameRu: null, unit: 'dona' };

function uniqueViolation() {
  return Err({ message: 'duplicate key value violates unique constraint', code: 'DB_ERROR' as const, details: { pgCode: '23505' } });
}
function otherFailure() {
  return Err({ message: 'connection reset', code: 'DB_ERROR' as const, details: { pgCode: '08006' } });
}

describe('PosStockIssuableService.generateInboundBarcode — C8.2 allocate+insert retry', () => {
  let repo: jest.Mocked<Partial<PosStockIssuableRepository>>;
  let service: PosStockIssuableService;
  let seqCounter: number;

  beforeEach(() => {
    seqCounter = 1;
    repo = {
      findWarehouseLabelConfig: jest.fn().mockResolvedValue(Ok(CFG)),
      findMaterialForLabel: jest.fn().mockResolvedValue(Ok(MAT)),
      nextSequenceForPrefix: jest.fn().mockImplementation(async () => Ok(seqCounter++)),
      barcodeExists: jest.fn().mockResolvedValue(Ok(false)),
      insertGeneratedBarcode: jest.fn(),
    };
    service = new PosStockIssuableService(repo as PosStockIssuableRepository);
  });

  const INPUT = { materialCardId: 20, warehouseId: 5, quantity: 3, unit: 'dona', requestedBy: 9 };

  it('succeeds on the first allocate+insert attempt when there is no collision', async () => {
    (repo.insertGeneratedBarcode as jest.Mock).mockResolvedValueOnce(Ok({ id: 100 }));

    const result = await service.generateInboundBarcode(INPUT);

    expect(result.ok).toBe(true);
    expect(repo.insertGeneratedBarcode).toHaveBeenCalledTimes(1);
  });

  it('retries the whole allocate+insert cycle on a 23505 collision and succeeds', async () => {
    (repo.insertGeneratedBarcode as jest.Mock)
      .mockResolvedValueOnce(uniqueViolation())
      .mockResolvedValueOnce(Ok({ id: 101 }));

    const result = await service.generateInboundBarcode(INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.queueId).toBe(101);
    expect(repo.insertGeneratedBarcode).toHaveBeenCalledTimes(2);
    // a fresh allocation cycle re-runs nextSequenceForPrefix — proves it's not just retrying
    // the same doomed insert with the same barcode.
    expect(repo.nextSequenceForPrefix).toHaveBeenCalledTimes(2);
    const firstBarcode = (repo.insertGeneratedBarcode as jest.Mock).mock.calls[0][0].barcode;
    const secondBarcode = (repo.insertGeneratedBarcode as jest.Mock).mock.calls[1][0].barcode;
    expect(firstBarcode).not.toBe(secondBarcode);
  });

  it('gives up after exhausting retries when every attempt collides, without crashing', async () => {
    (repo.insertGeneratedBarcode as jest.Mock).mockResolvedValue(uniqueViolation());

    const result = await service.generateInboundBarcode(INPUT);

    expect(result.ok).toBe(false);
    expect(repo.insertGeneratedBarcode).toHaveBeenCalledTimes(5); // MAX_BARCODE_ALLOCATE_RETRIES
  });

  it('does not retry on a non-collision failure (different Postgres error code)', async () => {
    (repo.insertGeneratedBarcode as jest.Mock).mockResolvedValue(otherFailure());

    const result = await service.generateInboundBarcode(INPUT);

    expect(result.ok).toBe(false);
    expect(repo.insertGeneratedBarcode).toHaveBeenCalledTimes(1);
  });
});
