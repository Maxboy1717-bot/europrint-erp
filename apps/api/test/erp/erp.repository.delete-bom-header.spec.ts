/**
 * test/erp/erp.repository.delete-bom-header.spec.ts
 *
 * C6.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): bom_items has no FK to
 * bom_headers (only component_id→material_cards, NO ACTION) — deleteBomHeader()
 * used to hard-DELETE only the header row, leaving any bom_items referencing it
 * via bom_id orphaned (deleteBomItem was never called on header delete). The
 * fix wraps both deletes in one db.transaction so the cascade is atomic.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockTxExecute = jest.fn();
const mockTransaction = jest.fn(async (cb: (tx: { execute: typeof mockTxExecute }) => unknown) =>
  cb({ execute: mockTxExecute }),
);

jest.mock('@shared/db', () => ({
  db: { transaction: (cb: never) => mockTransaction(cb) },
  runQuery: jest.fn(),
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { ErpRepository } from '../../src/modules/erp/erp.repository';

describe('ErpRepository.deleteBomHeader — C6.1 orphan cascade', () => {
  let repo: ErpRepository;

  beforeEach(() => {
    mockTxExecute.mockReset();
    mockTransaction.mockClear();
    repo = new ErpRepository();
  });

  it('deletes child bom_items before deleting the header, in the same transaction', async () => {
    const calls: string[] = [];
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      calls.push(text);
      if (text.includes('DELETE FROM bom_items')) return { rows: [] };
      if (text.includes('DELETE FROM bom_headers')) return { rows: [{ id: 9, bom_number: 'C61-TEST-BOM' }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.deleteBomHeader(9);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 9, bom_number: 'C61-TEST-BOM' });
    // bom_items must be deleted BEFORE bom_headers (order matters for the cascade to be meaningful).
    const itemsIdx = calls.findIndex((t) => t.includes('DELETE FROM bom_items'));
    const headerIdx = calls.findIndex((t) => t.includes('DELETE FROM bom_headers'));
    expect(itemsIdx).toBeGreaterThanOrEqual(0);
    expect(headerIdx).toBeGreaterThan(itemsIdx);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not orphan anything when the header has zero existing items (empty cascade, no crash)', async () => {
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('DELETE FROM bom_items')) return { rows: [] }; // nothing to delete
      if (text.includes('DELETE FROM bom_headers')) return { rows: [{ id: 10 }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.deleteBomHeader(10);
    expect(result.ok).toBe(true);
  });

  it('returns a fallback {id, deleted:true} when the header RETURNING yields no row', async () => {
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('DELETE FROM bom_items')) return { rows: [] };
      if (text.includes('DELETE FROM bom_headers')) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.deleteBomHeader(999);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 999, deleted: true });
  });
});
