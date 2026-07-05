/**
 * test/pos/pos-wms-sync.service.created-by.spec.ts
 *
 * B14 (2026-07-05): PosWmsSyncService.onMovementCreated() draft-inserted into
 * warehouse_transactions without ever reading event.updatedById, even though the
 * event always carries it -- created_by stayed NULL for every POS-driven draft
 * transaction. Proves the value is now threaded into the INSERT.
 *
 * Strategy: mock @shared/db (runQuery) so no real DB call is made, mirroring
 * test/sd/drizzle-sd-customers-duplicate.repo.spec.ts (same Residual Fix Loop B14 task).
 */

const mockRunQuery = jest.fn();

jest.mock('@shared/db', () => ({
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
}));

import { PosWmsSyncService } from '../../src/modules/pos/application/services/pos-wms-sync.service';
import type { PosMovementCreatedEvent } from '../../src/modules/pos/application/services/pos-wms-sync.helpers';

describe('PosWmsSyncService.onMovementCreated created_by wiring (B14)', () => {
  let svc: PosWmsSyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new PosWmsSyncService();
  });

  it('writes event.updatedById into warehouse_transactions.created_by', async () => {
    mockRunQuery
      .mockResolvedValueOnce([{ id: 1, movement_type: 'chiqim', from_warehouse_id: null, to_warehouse_id: null, movement_number: 'MOV-1', bulim: null }])
      .mockResolvedValueOnce([{ material_card_id: 7, quantity: '5', unit_of_measure: 'kg' }])
      .mockResolvedValueOnce([]);

    const event: PosMovementCreatedEvent = {
      movementId: 1,
      movementNumber: 'MOV-1',
      oldStatus: 'draft',
      newStatus: 'draft',
      updatedById: 42,
    };

    await svc.onMovementCreated(event);

    // The drizzle `sql` tagged template's queryChunks alternate between
    // {value: [text]} StringChunks and raw interpolated parameter values.
    const insertCall = mockRunQuery.mock.calls[2];
    const chunks = insertCall[0].queryChunks as Array<{ value?: string[] } | unknown>;
    const text = chunks
      .map((c) => (c as { value?: string[] })?.value?.join('') ?? '')
      .join('');
    expect(text).toContain('INSERT INTO warehouse_transactions');
    expect(text).toContain('created_by');

    // created_by is the 8th interpolated value (material_id, transaction_date,
    // transaction_type, quantity, unit_of_measure, bulim, document_number, created_by).
    const rawValues = chunks.filter((c) => typeof c !== 'object' || c === null);
    expect(rawValues[7]).toBe(42);
  });
});
