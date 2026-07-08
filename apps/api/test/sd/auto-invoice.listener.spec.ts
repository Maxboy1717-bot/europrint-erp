/**
 * test/sd/auto-invoice.listener.spec.ts
 *
 * VISION-3340 #50: auto-invoice on billable-status transition. Unit tests for
 * AutoInvoiceListener — the @EventsHandler(OrderStatusChangedEvent) that
 * dispatches CreateInvoiceCommand when an order reaches an invoiceable status
 * and no invoice exists yet for that order.
 *
 * Strategy: mock @shared/db (db.execute) so no real DB call is made, mirroring
 * test/sd/queries-sd-soft-delete-audit.spec.ts. drizzle-orm's `sql` tag stays
 * real — it only builds a query object, no I/O. CommandBus is a jest mock so
 * we assert the exact CreateInvoiceCommand payload without touching the
 * (already-tested) CreateInvoiceHandler.
 */

const mockExecute = jest.fn();

jest.mock('@shared/db', () => ({
  db: { execute: mockExecute },
}));

import { CommandBus } from '@nestjs/cqrs';
import { AutoInvoiceListener } from '../../src/modules/sd/infrastructure/event-handlers/auto-invoice.listener';
import { OrderStatusChangedEvent } from '../../src/modules/sd/domain/events/order-status-changed.event';
import { CreateInvoiceCommand } from '../../src/modules/sd/application/commands/create-invoice.command';
import { Ok } from '../../src/common/result';

// The drizzle `sql` tagged template's queryChunks alternate between
// {value: [text]} StringChunks and raw interpolated parameter values.
function queryText(query: { queryChunks: unknown[] }): string {
  return (query.queryChunks as Array<{ value?: string[] } | unknown>)
    .map((c) => (c as { value?: string[] })?.value?.join('') ?? '')
    .join('');
}

function makeBus(): jest.Mocked<CommandBus> {
  return {
    execute: jest.fn().mockResolvedValue(Ok({ invoice_number: 'INV-1', status: 'draft' })),
  } as unknown as jest.Mocked<CommandBus>;
}

function makeListener(bus: CommandBus): AutoInvoiceListener {
  return new AutoInvoiceListener(bus);
}

/** db.execute call order inside handle(): 1=dup-check, 2=order+customer, 3=line items. */
function primeHappyPath(overrides?: {
  existingInvoiceRows?: unknown[];
  orderRows?: unknown[];
  itemRows?: unknown[];
}): void {
  mockExecute
    .mockResolvedValueOnce({ rows: overrides?.existingInvoiceRows ?? [] })
    .mockResolvedValueOnce({
      rows: overrides?.orderRows ?? [
        { id: 7, customer_id: 3, created_by_user_id: 5, customer_name: 'Acme MChJ' },
      ],
    })
    .mockResolvedValueOnce({
      rows: overrides?.itemRows ?? [
        { description: 'Karton A4', order_quantity: '10', net_price: '50000' },
        { description: 'Karton A3', order_quantity: '5', net_price: '80000' },
      ],
    });
}

describe('AutoInvoiceListener (VISION-3340 #50)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // mockReset also drops the queued mockResolvedValueOnce values — tests that
    // skip early (dup-check hit) must not leak their unconsumed queue entries
    // into the next test (clearAllMocks alone keeps the once-queue).
    mockExecute.mockReset();
  });

  it('ignores transitions to non-invoiceable statuses (no DB call, no dispatch)', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'on_hold'));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('ignores events with an invalid order id', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);

    await listener.handle(new OrderStatusChangedEvent(Number('abc'), 'draft', 'approved'));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('skips (idempotent) when an invoice already exists for the order', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath({ existingInvoiceRows: [{ id: 'inv-1' }] });

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved'));

    // Only the duplicate probe ran; order/items were never loaded.
    expect(mockExecute).toHaveBeenCalledTimes(1);
    const probe = mockExecute.mock.calls[0][0] as { queryChunks: unknown[] };
    expect(queryText(probe)).toContain('FROM invoices');
    expect(queryText(probe)).toContain('deleted_at IS NULL');
    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('dispatches CreateInvoiceCommand with the order line items on a billable transition', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath();

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved'));

    expect(mockExecute).toHaveBeenCalledTimes(3);
    const itemsQuery = mockExecute.mock.calls[2][0] as { queryChunks: unknown[] };
    expect(queryText(itemsQuery)).toContain('FROM sales_order_items');

    expect(bus.execute).toHaveBeenCalledTimes(1);
    const cmd = (bus.execute as jest.Mock).mock.calls[0][0] as CreateInvoiceCommand;
    expect(cmd).toBeInstanceOf(CreateInvoiceCommand);
    expect(cmd.salesOrderId).toBe('7');
    expect(cmd.customerName).toBe('Acme MChJ');
    expect(cmd.userId).toBe('5');
    expect(cmd.dueDate).toBeInstanceOf(Date);
    expect(Array.isArray(cmd.items)).toBe(true);
    expect(cmd.items).toEqual([
      { name: 'Karton A4', quantity: 10, unitPrice: 50_000, taxRate: 12 },
      { name: 'Karton A3', quantity: 5, unitPrice: 80_000, taxRate: 12 },
    ]);
  });

  it('fires for every INVOICEABLE status, not just approved', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath();

    await listener.handle(new OrderStatusChangedEvent(7, 'in_production', 'shipped'));

    expect(bus.execute).toHaveBeenCalledTimes(1);
  });

  it('skips when the order is not found (or soft-deleted)', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath({ orderRows: [] });

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved'));

    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('skips without fabricating when the order has no linked customer name (Q-40)', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath({
      orderRows: [{ id: 7, customer_id: null, created_by_user_id: 5, customer_name: null }],
    });

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved'));

    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('skips without fabricating when the order has no created_by_user_id (Q-40)', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath({
      orderRows: [{ id: 7, customer_id: 3, created_by_user_id: null, customer_name: 'Acme MChJ' }],
    });

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved'));

    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('skips when the order has no line items — nothing to invoice', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    primeHappyPath({ itemRows: [] });

    await listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved'));

    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('never throws when the DB probe fails (fire-and-forget listener)', async () => {
    const bus = makeBus();
    const listener = makeListener(bus);
    mockExecute.mockRejectedValueOnce(new Error('connection refused'));

    await expect(
      listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved')),
    ).resolves.toBeUndefined();

    expect(bus.execute).not.toHaveBeenCalled();
  });

  it('never throws when the command handler rejects (logged, no crash)', async () => {
    const bus = makeBus();
    (bus.execute as jest.Mock).mockResolvedValue({
      ok: false,
      error: { code: 'BAD_REQUEST', message: 'holatda faktura yaratib bo\'lmaydi' },
    });
    const listener = makeListener(bus);
    primeHappyPath();

    await expect(
      listener.handle(new OrderStatusChangedEvent(7, 'draft', 'approved')),
    ).resolves.toBeUndefined();

    expect(bus.execute).toHaveBeenCalledTimes(1);
  });
});
