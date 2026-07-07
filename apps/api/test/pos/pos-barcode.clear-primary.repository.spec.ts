/**
 * test/pos/pos-barcode.clear-primary.repository.spec.ts
 *
 * C8.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): execPosBarcodeClearPrimary() used to demote
 * `isPrimary` on `inventory_barcode_assignments` filtered by `passportId = materialCardId` —
 * but that table is keyed by a *passport* id (inventory_passports.id), an entirely different,
 * unrelated barcode table (passport/serial-number tracking). Passing a material_card id as a
 * passport id there is a no-op in practice, so the OLD primary row in the REAL barcode table
 * (`pos_barcode_map`, the one findByBarcode()'s `... AND is_primary = TRUE` branch reads from)
 * was never demoted. Result: after reassigning a material's primary barcode, the old/reissued
 * barcode value kept `is_primary = TRUE` forever and kept resolving via findByBarcode().
 *
 * This test proves the fix: execPosBarcodeClearPrimary() now updates `pos_barcode_map`,
 * filtered by `materialCardId` (not `inventory_barcode_assignments`/`passportId`).
 */

function sqlText(cond: unknown): string {
  if (!cond || typeof cond !== 'object') return String(cond);
  const chunks = (cond as { queryChunks?: unknown[] }).queryChunks;
  if (!Array.isArray(chunks)) return '';
  return chunks
    .map((c) => {
      if (c && typeof c === 'object' && 'value' in (c as object)) return (c as { value: string[] }).value.join('');
      if (c && typeof c === 'object' && 'queryChunks' in (c as object)) return sqlText(c);
      return String(c);
    })
    .join(' ');
}

const posBarcodeMapStub = { materialCardId: 'pos_barcode_map.material_id', isPrimary: 'pos_barcode_map.is_primary' };
const inventoryBarcodeAssignmentsStub = { passportId: 'inventory_barcode_assignments.passport_id', isPrimary: 'inventory_barcode_assignments.is_primary' };

const updateCalls: unknown[] = [];
let lastSetArg: unknown = null;
let lastWhereArg: unknown = null;

jest.mock('@shared/db', () => ({
  db: {
    update: jest.fn((table: unknown) => {
      updateCalls.push(table);
      return {
        set: (arg: unknown) => {
          lastSetArg = arg;
          return {
            where: (w: unknown) => {
              lastWhereArg = w;
              return Promise.resolve();
            },
          };
        },
      };
    }),
  },
  pos_barcode_map: posBarcodeMapStub,
  inventory_barcode_assignments: inventoryBarcodeAssignmentsStub,
}));

import { execPosBarcodeClearPrimary } from '../../src/common/database/queries-remaining-b';

describe('execPosBarcodeClearPrimary — C8.6 correct-table fix', () => {
  beforeEach(() => {
    updateCalls.length = 0;
    lastSetArg = null;
    lastWhereArg = null;
  });

  it('updates pos_barcode_map, not inventory_barcode_assignments', async () => {
    await execPosBarcodeClearPrimary(42);

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toBe(posBarcodeMapStub);
    expect(updateCalls[0]).not.toBe(inventoryBarcodeAssignmentsStub);
  });

  it('demotes isPrimary to false', async () => {
    await execPosBarcodeClearPrimary(42);

    expect(lastSetArg).toEqual({ isPrimary: false });
  });

  it('filters by pos_barcode_map.materialCardId (not passportId)', async () => {
    await execPosBarcodeClearPrimary(42);

    const text = sqlText(lastWhereArg);
    expect(text).toContain('pos_barcode_map.material_id');
    expect(text).toContain('pos_barcode_map.is_primary');
    expect(text).not.toContain('passport_id');
    expect(text).toContain('42');
  });
});
