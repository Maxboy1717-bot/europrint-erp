/**
 * test/integration/triggers/pp-cancelled-to-so-on-hold.spec.ts
 *
 * Golden-thread gap fix: cancelling a production order (PATCH
 * /planning/operations/:id -> status='cancelled') previously never notified
 * SD. PpPlanningService now publishes PpCancelledEvent(poId, salesOrderId);
 * PpCancelledSdListener (SD module) reacts by putting the linked sales order
 * on hold via a guarded, idempotent UPDATE. `runQuery` is mocked so no live
 * DB connection is required (same pattern as
 * test/notifications/deal-won-notification.listener.spec.ts).
 */

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { runQuery } from '@shared/db';
import { PpCancelledSdListener } from '../../../src/modules/sd/infrastructure/event-handlers/pp-cancelled-sd.listener';
import { PpCancelledEvent } from '../../../src/modules/pp/domain/events/pp-cancelled.event';

describe('Trigger: PpCancelledEvent -> sales_orders on_hold', () => {
  let listener: PpCancelledSdListener;
  const mockedRunQuery = runQuery as unknown as jest.Mock;

  beforeEach(async () => {
    mockedRunQuery.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [PpCancelledSdListener],
    }).compile();
    listener = moduleRef.get(PpCancelledSdListener);
  });

  it('puts the linked sales order on hold with a guarded UPDATE', async () => {
    mockedRunQuery.mockResolvedValueOnce({ rows: [{ id: 56 }] });

    await listener.handle(new PpCancelledEvent(5, 56));

    expect(mockedRunQuery).toHaveBeenCalledTimes(1);
    const queryArg = mockedRunQuery.mock.calls[0][0];
    const queryText = JSON.stringify(queryArg);
    expect(queryText).toContain('sales_orders');
    expect(queryText).toContain('on_hold');
    expect(queryText).toContain('cancelled');
    expect(queryText).toContain('delivered');
    expect(queryText).toContain('closed');
  });

  it('is a no-op (idempotent) when the sales order already matched a terminal state', async () => {
    // Guard clause excluded the row -> UPDATE ... RETURNING id matches 0 rows.
    mockedRunQuery.mockResolvedValueOnce({ rows: [] });

    await expect(listener.handle(new PpCancelledEvent(5, 56))).resolves.toBeUndefined();

    expect(mockedRunQuery).toHaveBeenCalledTimes(1);
  });

  it('skips the query entirely when salesOrderId is missing/invalid (no linked SO)', async () => {
    await listener.handle(new PpCancelledEvent(5, 0));

    expect(mockedRunQuery).not.toHaveBeenCalled();
  });

  it('swallows query failures without throwing (logger.error path)', async () => {
    mockedRunQuery.mockRejectedValueOnce(new Error('DB down'));

    await expect(listener.handle(new PpCancelledEvent(5, 56))).resolves.toBeUndefined();
  });
});
