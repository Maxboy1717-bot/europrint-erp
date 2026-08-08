/**
 * test/compatibility/pos-warehouse-integration-movement.service.oversell-guard.spec.ts
 *
 * C1.5 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): validateOutboundStock() reads
 * available_quantity BEFORE the transaction opens; decreaseFromWarehouseStock() then
 * wrote an unconditional UPDATE inside the transaction with no guard at all — two
 * concurrent movements against the same (warehouse_id, material_id) row could both
 * pass the stale pre-check and both apply their decrement (TOCTOU oversell). The write
 * is now a guarded UPDATE (RETURNING id) that re-checks stock atomically against the
 * row Postgres has just locked, closing the race the pre-check cannot. Per the existing
 * PRD Q38 rule, ASSET material hard-blocks on insufficient stock; CONSUMABLE material
 * is still allowed to go negative (with a warn-log) — the guard preserves this exactly.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockTxExecute = jest.fn();
const mockRawSql = jest.fn();
const mockTransaction = jest.fn(async (cb: (tx: { execute: typeof mockTxExecute }) => unknown) =>
  cb({ execute: mockTxExecute }),
);

jest.mock('@shared/db', () => ({
  db: { transaction: (cb: never) => mockTransaction(cb) },
  rawSql: (...args: unknown[]) => mockRawSql(...args),
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { PosWarehouseIntegrationMovementService, PosMovementDto } from '../../src/modules/compatibility/pos-warehouse-integration-movement.service';

const i18n = { t: jest.fn(async (key: string) => key) } as never;

const BASE_DTO: PosMovementDto = {
  movementType: 'EXTERNAL_OUT',
  fromWarehouseId: 2,
  materialCardId: 1,
  quantity: 5,
  performedBy: 9,
};

describe('PosWarehouseIntegrationMovementService — C1.5 oversell guard', () => {
  let service: PosWarehouseIntegrationMovementService;

  beforeEach(() => {
    mockTxExecute.mockReset();
    mockRawSql.mockReset();
    mockTransaction.mockClear();
    service = new PosWarehouseIntegrationMovementService(i18n);
  });

  it('ASSET: blocks the outbound write when the guarded UPDATE loses the race, even though the pre-check said sufficient', async () => {
    // Pre-check (outside the tx) sees a stale snapshot: 10 available, ASSET.
    mockRawSql.mockResolvedValue({ rows: [{ available_quantity: '10', material_type: 'ASSET' }] });

    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO material_movements')) return { rows: [{ id: 555 }] };
      if (text.includes('UPDATE warehouse_stock') && text.includes('RETURNING id')) return { rows: [] }; // guard lost the race
      if (text.includes('SELECT available_quantity FROM warehouse_stock')) return { rows: [{ available_quantity: '0' }] };
      throw new Error(`Unexpected tx query: ${text}`);
    });

    const result = await service.createMovement(BASE_DTO);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/assetInsufficientStock/);
    // increaseToWarehouseStock/refreshMaterialCurrentStock must never run once the guard fails.
    const calls = mockTxExecute.mock.calls.map((c) => sqlText(c[0]));
    expect(calls.some((t) => t.includes('INSERT INTO warehouse_stock'))).toBe(false);
    expect(calls.some((t) => t.includes('UPDATE material_cards'))).toBe(false);
  });

  it('ASSET: succeeds when the guarded UPDATE confirms sufficient stock', async () => {
    mockRawSql.mockResolvedValue({ rows: [{ available_quantity: '10', material_type: 'ASSET' }] });
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO material_movements')) return { rows: [{ id: 556 }] };
      if (text.includes('UPDATE warehouse_stock') && text.includes('RETURNING id')) return { rows: [{ id: 42 }] };
      if (text.includes('UPDATE material_cards')) return { rows: [] };
      throw new Error(`Unexpected tx query: ${text}`);
    });

    const result = await service.createMovement(BASE_DTO);
    expect(result.ok).toBe(true);
  });

  it('CONSUMABLE: guarded UPDATE still applies (allowing negative available_quantity) when stock is insufficient', async () => {
    mockRawSql.mockResolvedValue({ rows: [{ available_quantity: '10', material_type: 'CONSUMABLE' }] });
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO material_movements')) return { rows: [{ id: 557 }] };
      // Guard SQL includes "OR NOT EXISTS (... material_type = 'ASSET')" — for a CONSUMABLE
      // row this branch is satisfied regardless of available_quantity, so it applies.
      if (text.includes('UPDATE warehouse_stock') && text.includes('RETURNING id')) return { rows: [{ id: 43 }] };
      if (text.includes('UPDATE material_cards')) return { rows: [] };
      throw new Error(`Unexpected tx query: ${text}`);
    });

    const result = await service.createMovement(BASE_DTO);
    expect(result.ok).toBe(true);
  });
});
