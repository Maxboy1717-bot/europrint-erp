/**
 * test/sd/drizzle-sales-order.repo.save-items-unit.spec.ts
 *
 * B13/Decision 3 (2026-07-06): sales_order_items.unit defaulted to the
 * free-text 'PC' when a line item omitted its unit. The canonical
 * unit_of_measures.code for "piece" is 'dona' -- proves the default was
 * corrected and that an explicitly-supplied unit still passes through
 * unchanged (only the fallback changed, not caller-supplied values).
 */

import { DrizzleSalesOrderRepository } from '../../src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo';
import type { DrizzleTxExecutor } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';

function makeTx() {
  return { execute: jest.fn().mockResolvedValue({ rows: [] }) } as unknown as DrizzleTxExecutor;
}

describe('DrizzleSalesOrderRepository.saveItems unit default (B13)', () => {
  it('defaults unit to "dona" (not "PC") when a line item omits it', async () => {
    const repo = new DrizzleSalesOrderRepository();
    const tx = makeTx();

    await repo.saveItems(1, [
      { productId: 7, description: 'Test item', orderQuantity: 10, netPrice: 1000 },
    ], tx);

    const sqlCall = (tx.execute as jest.Mock).mock.calls[0][0];
    const values = (sqlCall.queryChunks as unknown[]).filter((c) => typeof c !== 'object' || c === null);
    expect(values).toContain('dona');
    expect(values).not.toContain('PC');
  });

  it('preserves an explicitly-supplied unit unchanged', async () => {
    const repo = new DrizzleSalesOrderRepository();
    const tx = makeTx();

    await repo.saveItems(1, [
      { productId: 7, description: 'Test item', orderQuantity: 10, netPrice: 1000, unit: 'kg' },
    ], tx);

    const sqlCall = (tx.execute as jest.Mock).mock.calls[0][0];
    const values = (sqlCall.queryChunks as unknown[]).filter((c) => typeof c !== 'object' || c === null);
    expect(values).toContain('kg');
  });
});
