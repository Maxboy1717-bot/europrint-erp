/**
 * test/pos/pos-barcode.repository.find-by-barcode-active-filter.spec.ts
 *
 * C6.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): findByBarcode() matched material_cards via
 * direct barcode, pos_barcode_map primary alias, or material_barcodes gtin/sscc — with no
 * deleted_at/is_active filter on any of the 3 paths. A soft-deleted or deactivated material
 * still resolved to a live scan result (cached 1h per the audit's own note).
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockDbExecute = jest.fn();
jest.mock('@workspace/db', () => ({
  db: { execute: (...args: unknown[]) => mockDbExecute(...args) },
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));
jest.mock('@common/database/queries-remaining', () => ({ execPosBarcodeClearPrimary: jest.fn() }));

import { PosBarcodeRepository } from '../../src/modules/pos/infrastructure/repositories/pos-barcode.repository';

describe('PosBarcodeRepository.findByBarcode — C6.4 active/soft-delete filter', () => {
  let repo: PosBarcodeRepository;

  beforeEach(() => {
    mockDbExecute.mockReset();
    repo = new PosBarcodeRepository();
  });

  it('applies deleted_at IS NULL and is_active = true across all 3 match paths', async () => {
    mockDbExecute.mockResolvedValue({ rows: [] });

    await repo.findByBarcode('SOME-BARCODE');

    expect(mockDbExecute).toHaveBeenCalledTimes(1);
    const text = sqlText(mockDbExecute.mock.calls[0][0]);
    expect(text).toContain('deleted_at IS NULL');
    expect(text).toContain('is_active = true');
    // the filter must apply to the WHOLE OR/UNION group, not just the first branch
    expect(text).toContain('pos_barcode_map');
    expect(text).toContain('material_barcodes');
  });

  it('returns null when the only match is soft-deleted', async () => {
    mockDbExecute.mockResolvedValue({ rows: [] }); // simulates the filter excluding the row

    const result = await repo.findByBarcode('DELETED-BARCODE');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBeNull();
  });

  it('resolves a live, active material normally', async () => {
    mockDbExecute.mockResolvedValue({ rows: [{ id: 1, barcode: 'X1' }] });

    const result = await repo.findByBarcode('X1');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).not.toBeNull();
  });
});
