/**
 * test/mm/drizzle-mm.repo.save-po-unit.spec.ts
 *
 * B13/Decision 3 (2026-07-06): purchase_order_items.unit was hardcoded to the
 * free-text 'sht' -- PurchaseOrderItem has no unit field on the domain object,
 * so the repository supplied a fallback. The canonical unit_of_measures.code
 * for "piece" is 'dona'. Proves the INSERT now uses the corrected default.
 *
 * Strategy: mock @shared/db (db.execute) so no real DB call is made, mirroring
 * test/pos/pos-wms-sync.service.created-by.spec.ts (same drizzle sql tagged-
 * template queryChunks inspection technique, same Residual Fix Loop task family).
 */

const mockExecute = jest.fn().mockResolvedValue({ rows: [{ id: 1 }] });

jest.mock('@shared/db', () => ({
  db: { execute: (...args: unknown[]) => mockExecute(...args) },
}));

import { DrizzleMmRepository } from '../../src/modules/mm/infrastructure/repositories/drizzle-mm.repo';
import { PurchaseOrder, PurchaseOrderItem } from '../../src/modules/mm/domain/aggregates/purchase-order.aggregate';

describe('DrizzleMmRepository.savePurchaseOrder unit default (B13)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts purchase_order_items.unit as "dona" (not "sht")', async () => {
    const po = new PurchaseOrder(1, 'PO-2026-0001', 100, 7);
    const addRes = po.addItem(new PurchaseOrderItem(5, 10, 1000));
    if (!addRes.ok) throw new Error('fixture: addItem failed');

    const repo = new DrizzleMmRepository({} as ConstructorParameters<typeof DrizzleMmRepository>[0]);
    await repo.savePurchaseOrder(po);

    // Call 0 = header INSERT INTO purchase_orders; call 1 = line-item INSERT INTO purchase_order_items.
    const itemInsertCall = mockExecute.mock.calls[1][0];
    const values = (itemInsertCall.queryChunks as unknown[]).filter((c) => typeof c !== 'object' || c === null);
    expect(values).toContain('dona');
    expect(values).not.toContain('sht');
  });
});
