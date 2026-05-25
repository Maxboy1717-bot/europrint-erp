/**
 * test/mm/mm-goods.service.spec.ts
 *
 * MmGoodsService orchestrates goods-receipts, goods-issues and the
 * three-way match check. Notable behaviours:
 *   - createGoodsReceipt fans out item inserts in parallel via Promise.all
 *   - getGoodsReceipt translates a null receipt into NotFoundException
 *     (mapped by safeCall to NOT_FOUND)
 *   - i18n translation key is resolved before throwing the not-found path
 */

import { MmGoodsService } from '../../src/modules/mm/application/mm-goods.service';
import { DrizzleMmGoodsRepository } from '../../src/modules/mm/infrastructure/repositories/drizzle-mm-goods.repo';

function buildRepo(overrides: Partial<jest.Mocked<DrizzleMmGoodsRepository>> = {}): jest.Mocked<DrizzleMmGoodsRepository> {
  return {
    listGoodsReceipts: jest.fn().mockResolvedValue([]),
    getGoodsReceipt: jest.fn().mockResolvedValue({ receipt: null, items: [] }),
    createGoodsReceipt: jest.fn().mockResolvedValue({ id: 1 }),
    insertGoodsReceiptItem: jest.fn().mockResolvedValue(undefined),
    updateGoodsReceipt: jest.fn().mockResolvedValue([]),
    deleteGoodsReceipt: jest.fn().mockResolvedValue(undefined),
    listGoodsIssues: jest.fn().mockResolvedValue([]),
    getGoodsIssue: jest.fn().mockResolvedValue({ issue: null, items: [] }),
    createGoodsIssue: jest.fn().mockResolvedValue({ id: 1 }),
    insertGoodsIssueItem: jest.fn().mockResolvedValue(undefined),
    updateGoodsIssue: jest.fn().mockResolvedValue([]),
    deleteGoodsIssue: jest.fn().mockResolvedValue(undefined),
    threeWayMatch: jest.fn().mockResolvedValue({ matched: true }),
    getCurrencies: jest.fn().mockResolvedValue([]),
    getPriceComparison: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as jest.Mocked<DrizzleMmGoodsRepository>;
}

const fakeI18n = { t: jest.fn().mockResolvedValue('Topilmadi') } as never;

describe('MmGoodsService', () => {
  it('listGoodsReceipts passes filters straight to the repository', async () => {
    const repo = buildRepo();
    const svc = new MmGoodsService(repo, fakeI18n);

    await svc.listGoodsReceipts(5, 'open', 25, 0);

    expect(repo.listGoodsReceipts).toHaveBeenCalledWith(5, 'open', 25, 0);
  });

  it('getGoodsReceipt returns header merged with items when found', async () => {
    const repo = buildRepo({
      getGoodsReceipt: jest.fn().mockResolvedValue({
        receipt: { id: 4, status: 'received' },
        items: [{ id: 1, materialId: 10 }],
      }),
    });
    const svc = new MmGoodsService(repo, fakeI18n);

    const r = await svc.getGoodsReceipt(4);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ id: 4, items: [{ id: 1, materialId: 10 }] });
  });

  it('getGoodsReceipt returns NOT_FOUND when the receipt is null', async () => {
    const repo = buildRepo({
      getGoodsReceipt: jest.fn().mockResolvedValue({ receipt: null, items: [] }),
    });
    const svc = new MmGoodsService(repo, fakeI18n);

    const r = await svc.getGoodsReceipt(404);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_FOUND');
  });

  it('createGoodsReceipt inserts header then fans out parallel line items', async () => {
    const repo = buildRepo({
      createGoodsReceipt: jest.fn().mockResolvedValue({ id: 42 }),
    });
    const svc = new MmGoodsService(repo, fakeI18n);

    const items = [
      { material_id: 1, ordered_qty: 10, received_qty: 10, batch_number: 'B-1' },
      { material_id: 2, ordered_qty: 5, received_qty: 4, batch_number: 'B-2' },
    ];

    await svc.createGoodsReceipt(7, 3, items, 'ok', 'DN-1');

    expect(repo.createGoodsReceipt).toHaveBeenCalledWith(7, 3, 'ok', 'DN-1');
    expect(repo.insertGoodsReceiptItem).toHaveBeenCalledTimes(2);
    expect(repo.insertGoodsReceiptItem).toHaveBeenCalledWith(42, 1, 10, 10, 'B-1');
    expect(repo.insertGoodsReceiptItem).toHaveBeenCalledWith(42, 2, 5, 4, 'B-2');
  });

  it('threeWayMatch is delegated to the repository helper', async () => {
    const repo = buildRepo({
      threeWayMatch: jest.fn().mockResolvedValue({ matched: false, reason: 'qty mismatch' }),
    });
    const svc = new MmGoodsService(repo, fakeI18n);

    const r = await svc.threeWayMatch(99);

    expect(repo.threeWayMatch).toHaveBeenCalledWith(99);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as { matched: boolean }).matched).toBe(false);
  });
});
