/**
 * test/sd/sd-quotations.repository.convert.spec.ts
 *
 * VISION-3340 #49 (SD golden-thread): convertQuotationToOrder used to INSERT the
 * sales order + flip the quotation to `converted` in ONE atomic transaction but
 * NEVER produced an OrderCreatedEvent / outbox row — so this conversion path was a
 * golden-thread dead-end (no PP/MES fan-out). These tests prove the fix:
 *   (1) behaviour preserved — the order is still created AND the quotation still
 *       flips to `converted` in the same transaction (no orphan);
 *   (2) the SAME OrderCreated outbox row the canonical create-order path writes is
 *       now inserted INSIDE that transaction (asserted via the tx-scoped
 *       outboxRepo.insertBatch call) and OrderCreatedEvent is published on the bus
 *       after commit;
 *   (3) atomicity — an outbox-insert failure throws inside the tx, so the whole
 *       conversion rolls back and NO event is published (an order can never exist
 *       without its event);
 *   (4) the re-conversion guard still short-circuits an already-`converted`
 *       quotation without creating a second order / event.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRunQuery = jest.fn();
const mockTransaction = jest.fn();
jest.mock('@shared/db', () => ({
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
  db: { transaction: (...args: unknown[]) => mockTransaction(...args) },
  domain_events: {},
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  SQL: class {}, SQLWrapper: class {},
}));

import { SdQuotationsRepository } from '../../src/modules/sd/infrastructure/repositories/sd-quotations.repository';
import { OrderCreatedEvent } from '../../src/modules/sd/domain/events/order-created.event';
import { ERP_EVENTS } from '../../src/common/constants/erp-events.constants';
import { Ok, Err, AppErr } from '../../src/common/result';

const i18n = { t: jest.fn().mockResolvedValue('invalid') } as unknown as import('nestjs-i18n').I18nService;

/** A tx handle whose execute() routes by SQL text (INSERT order / UPDATE quotation). */
function makeTx(insertedOrder: Record<string, unknown> | null) {
  return {
    execute: jest.fn(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO sales_orders')) return { rows: insertedOrder ? [insertedOrder] : [] };
      if (text.includes('UPDATE sd_quotations')) return { rows: [] };
      throw new Error(`Unexpected tx query: ${text}`);
    }),
  };
}

describe('SdQuotationsRepository.convertQuotationToOrder — #49 golden-thread', () => {
  let eventBus: { publish: jest.Mock };
  let outboxRepo: { insertBatch: jest.Mock };
  let repo: SdQuotationsRepository;

  const QUOTATION = {
    id: 'q-1', status: 'approved', order_id: null,
    total_amount: '1500000', customer_id: 42, advance_percent: 60,
  };
  const ORDER_ROW = { id: 555, order_number: 'QO-q-1-ABC', status: 'pending', total_amount: '1500000', created_at: '2026-07-08' };

  beforeEach(() => {
    mockRunQuery.mockReset();
    mockTransaction.mockReset();
    eventBus = { publish: jest.fn() };
    outboxRepo = { insertBatch: jest.fn().mockResolvedValue(Ok(undefined)) };
    repo = new SdQuotationsRepository(i18n, eventBus as never, outboxRepo as never);
  });

  it('still creates the order + marks the quotation converted, AND writes the OrderCreated outbox row in-tx + publishes the event', async () => {
    // getQuotationById → non-converted quotation
    mockRunQuery.mockImplementation(async (call: unknown) => {
      if (sqlText(call).includes('sd_quotations q')) return { rows: [QUOTATION] };
      throw new Error(`Unexpected runQuery: ${sqlText(call)}`);
    });
    const tx = makeTx(ORDER_ROW);
    mockTransaction.mockImplementation((cb: (t: unknown) => unknown) => cb(tx));

    const result = await repo.convertQuotationToOrder('q-1');

    // (1) behaviour preserved: order returned
    expect(result.ok).toBe(true);
    if (result.ok && 'order' in result.data) {
      expect((result.data.order as Record<string, unknown>).id).toBe(555);
      expect((result.data.order as Record<string, unknown>).order_number).toBe('QO-q-1-ABC');
    } else {
      throw new Error('expected an order payload');
    }

    // (1b) the quotation status flip ran in the SAME tx as the insert
    const txTexts = tx.execute.mock.calls.map((c) => sqlText(c[0]));
    expect(txTexts.some((t) => t.includes('INSERT INTO sales_orders'))).toBe(true);
    expect(txTexts.some((t) => t.includes('UPDATE sd_quotations') && t.includes("status = 'converted'"))).toBe(true);

    // (2a) OrderCreated outbox row written INSIDE the tx (2nd arg is the tx handle)
    expect(outboxRepo.insertBatch).toHaveBeenCalledTimes(1);
    const [rows, txArg] = outboxRepo.insertBatch.mock.calls[0];
    expect(txArg).toBe(tx); // participates in the atomic transaction
    expect(rows[0]).toMatchObject({
      aggregate_type: 'SalesOrder',
      aggregate_id: '555',
      event_name: ERP_EVENTS.ORDER_CREATED,
      payload: { orderId: 555, companyId: 42, orderNumber: 'QO-q-1-ABC', totalAmount: 1500000 },
    });

    // (2b) OrderCreatedEvent published on the bus after commit, real payload
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const published = eventBus.publish.mock.calls[0][0];
    expect(published).toBeInstanceOf(OrderCreatedEvent);
    expect(published).toMatchObject({ orderId: 555, companyId: 42, orderNumber: 'QO-q-1-ABC', totalAmount: 1500000 });
  });

  it('rolls back and publishes NO event when the outbox insert fails (order never exists without its event)', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      if (sqlText(call).includes('sd_quotations q')) return { rows: [QUOTATION] };
      throw new Error(`Unexpected runQuery: ${sqlText(call)}`);
    });
    outboxRepo.insertBatch.mockResolvedValue(Err(AppErr('DB_ERROR', 'outbox down')));
    const tx = makeTx(ORDER_ROW);
    // Model a real tx: if the callback throws, the transaction rejects (rollback).
    mockTransaction.mockImplementation(async (cb: (t: unknown) => unknown) => cb(tx));

    const result = await repo.convertQuotationToOrder('q-1');

    expect(result.ok).toBe(false); // safeCall('DB_ERROR') caught the rollback throw
    expect(eventBus.publish).not.toHaveBeenCalled(); // no event on a rolled-back conversion
  });

  it('re-conversion guard: an already-converted quotation returns the existing order WITHOUT creating a duplicate order/event', async () => {
    const converted = { ...QUOTATION, status: 'converted', order_id: 555 };
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('sd_quotations q')) return { rows: [converted] };
      if (text.includes('FROM sales_orders')) return { rows: [{ id: 555, order_number: 'QO-q-1-ABC' }] };
      throw new Error(`Unexpected runQuery: ${text}`);
    });

    const result = await repo.convertQuotationToOrder('q-1');

    expect(result.ok).toBe(true);
    if (result.ok && 'order' in result.data) {
      expect((result.data.order as Record<string, unknown>).id).toBe(555);
    } else {
      throw new Error('expected existing order payload');
    }
    // No second order, no duplicate outbox row, no duplicate event
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(outboxRepo.insertBatch).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
