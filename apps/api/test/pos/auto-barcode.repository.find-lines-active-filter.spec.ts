/**
 * test/pos/auto-barcode.repository.find-lines-active-filter.spec.ts
 *
 * C6.5 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): findLines() LEFT JOINs material_cards with no
 * deleted_at/is_active filter — a barcode print job could surface a soft-deleted material's
 * code/name as if it were live. The filter is added to the JOIN condition (not WHERE) so the
 * movement line itself is preserved (materialCode simply comes back NULL, which
 * AutoBarcodeService.generateBarcode() already treats as "unknown material" via its `?? 'MAT'`
 * fallback) instead of silently dropping the line from the barcode-generation batch.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockTypedExecute = jest.fn();
jest.mock('@shared/db/typed-execute', () => ({ typedExecute: (...args: unknown[]) => mockTypedExecute(...args) }));
jest.mock('@shared/db', () => ({ db: { execute: jest.fn() } }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { AutoBarcodeRepository } from '../../src/modules/pos/infrastructure/repositories/auto-barcode.repository';

describe('AutoBarcodeRepository.findLines — C6.5 active/soft-delete JOIN filter', () => {
  let repo: AutoBarcodeRepository;

  beforeEach(() => {
    mockTypedExecute.mockReset();
    repo = new AutoBarcodeRepository();
  });

  it('filters the material_cards LEFT JOIN on deleted_at IS NULL and is_active = true', async () => {
    mockTypedExecute.mockResolvedValue([]);

    await repo.findLines(1);

    expect(mockTypedExecute).toHaveBeenCalledTimes(1);
    const text = sqlText(mockTypedExecute.mock.calls[0][0]);
    expect(text).toContain('LEFT JOIN material_cards mc ON mc.id = pml.material_id AND mc.deleted_at IS NULL AND mc.is_active = true');
  });

  it('still returns the movement line when its material is soft-deleted (materialCode null)', async () => {
    mockTypedExecute.mockResolvedValue([
      { movementLineId: 27, materialCardId: 57, materialCode: null, batchNumber: null, quantity: '5', unit: 'dona' },
    ]);

    const result = await repo.findLines(1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].materialCode).toBeNull();
    }
  });
});
