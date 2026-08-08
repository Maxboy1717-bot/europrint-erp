/**
 * test/compatibility/warehouse-barcode-ops.service.scan-active-filter.spec.ts
 *
 * C6.3 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): scanBarcode() queried material_cards with no
 * deleted_at/is_active filter — a soft-deleted or deactivated material still scanned as live.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRawSql = jest.fn();
jest.mock('@shared/db', () => ({ rawSql: (...args: unknown[]) => mockRawSql(...args), db: {} }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { WarehouseBarcodeOpsService } from '../../src/modules/compatibility/warehouse-barcode-ops.service';

describe('WarehouseBarcodeOpsService.scanBarcode — C6.3 active/soft-delete filter', () => {
  let service: WarehouseBarcodeOpsService;

  beforeEach(() => {
    mockRawSql.mockReset();
    service = new WarehouseBarcodeOpsService({ t: jest.fn(async (k: string) => k) } as never);
  });

  it('filters on deleted_at IS NULL and is_active = true', async () => {
    mockRawSql.mockResolvedValue({ rows: [] });

    await service.scanBarcode('1234567890123');

    expect(mockRawSql).toHaveBeenCalledTimes(1);
    const text = sqlText(mockRawSql.mock.calls[0][0]);
    expect(text).toContain('deleted_at IS NULL');
    expect(text).toContain('is_active = true');
  });

  it('reports not-found when the only matching row is soft-deleted (query returns 0 rows)', async () => {
    mockRawSql.mockResolvedValue({ rows: [] }); // simulates the filter excluding a soft-deleted match

    const result = await service.scanBarcode('DELETED-BARCODE');

    expect(result.ok).toBe(true);
    if (result.ok) expect((result.data as { found: boolean }).found).toBe(false);
  });

  it('finds an active, non-deleted material normally', async () => {
    mockRawSql.mockResolvedValue({ rows: [{ id: 1, xomAshyo: 'Paper', barcode: 'X1', unitOfMeasure: 'dona' }] });

    const result = await service.scanBarcode('X1');

    expect(result.ok).toBe(true);
    if (result.ok) expect((result.data as { found: boolean }).found).toBe(true);
  });
});
