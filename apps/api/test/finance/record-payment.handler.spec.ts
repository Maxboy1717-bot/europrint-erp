/**
 * test/finance/record-payment.handler.spec.ts
 *
 * Unit tests for RecordPaymentHandler. FinanceRepository, GlPostingService and EventEmitter2 are
 * mocked; the Invoice aggregate is real. C1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): the handler
 * now wraps payment-INSERT + invoice-atomic-guarded-UPDATE in one `db.transaction`, so `@shared/db`
 * is mocked with a transaction shim (same pattern as create-order.handler.spec.ts) that just invokes
 * the callback — the mocked repo methods carry the actual test behavior, including a stateful guard
 * mock used to prove the double-spend race is closed.
 */

jest.mock('@shared/db', () => ({
  db: {
    transaction: jest.fn().mockImplementation(
      async (cb: (tx: unknown) => unknown) => cb(null),
    ),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';
import {
  RecordPaymentHandler,
  RecordPaymentCommand,
} from '../../src/modules/finance/application/commands/record-payment.handler';
import { FINANCE_REPO, AppliedInvoicePayment } from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import { Ok, Err, AppErr, Result } from '../../src/common/result';

interface InvoiceRow {
  id: number;
  total_amount: string;
  paid_amount: string;
  due_date: Date;
  invoice_number: string;
  customer_id: number;
  status: 'posted' | 'partial_paid' | 'full_paid';
  created_at: Date;
}

function makeInvoiceRow(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: 501,
    total_amount: '1000000',
    paid_amount: '0',
    due_date: new Date('2099-12-31'),
    invoice_number: 'INV-2026-0501',
    customer_id: 42,
    status: 'posted',
    created_at: new Date('2026-05-01'),
    ...overrides,
  };
}

/**
 * Models the real atomic guarded UPDATE (`paid_amount += amount WHERE paid_amount+amount<=
 * total_amount`) against an in-memory row. Synchronous body (no `await` before the mutation) so
 * that under `Promise.all`, whichever concurrent call reaches this function first runs its
 * check-and-mutate to completion before the other one's call starts — exactly modeling Postgres
 * row-level locking serializing two concurrent UPDATEs on the same invoice row.
 */
function makeStatefulGuard(totalAmount: number, initialPaid = 0) {
  const state = { paidAmount: initialPaid, totalAmount };
  const applyInvoicePayment = jest.fn(
    async (_invoiceId: number, amount: number): Promise<Result<AppliedInvoicePayment | null>> => {
      const newPaid = state.paidAmount + amount;
      if (newPaid > state.totalAmount) return Ok(null);
      state.paidAmount = newPaid;
      const paymentStatus = newPaid >= state.totalAmount ? 'paid' : 'partial';
      return Ok({ paidAmount: newPaid, totalAmount: state.totalAmount, paymentStatus });
    },
  );
  return { applyInvoicePayment, state };
}

let nextPaymentDbId = 1000;
function makeRepo(row: InvoiceRow | null, opts: { guard?: ReturnType<typeof makeStatefulGuard> } = {}) {
  const guard = opts.guard ?? makeStatefulGuard(row ? parseFloat(row.total_amount) : 0, row ? parseFloat(row.paid_amount) : 0);
  return {
    findInvoiceById: jest.fn().mockResolvedValue(
      row ? Ok(row) : Err(AppErr('NOT_FOUND', 'Invoice not found')),
    ),
    findPaymentByIdempotencyKey: jest.fn().mockResolvedValue(Ok(null)),
    applyInvoicePayment: guard.applyInvoicePayment,
    recordPayment: jest.fn().mockImplementation(async () => Ok({ id: nextPaymentDbId++ })),
    reverseInvoicePayment: jest.fn().mockResolvedValue(Ok(undefined)),
    guardState: guard.state,
  };
}

function makeGl(success = true) {
  return {
    postCustomerPayment: jest.fn().mockResolvedValue(
      success ? Ok(123) : Err(AppErr('INTERNAL', 'gl down')),
    ),
  } as unknown as GlPostingService;
}

function makeEmitter() {
  return { emit: jest.fn() } as unknown as EventEmitter2;
}

function makeEventBus() {
  return { publish: jest.fn() } as unknown as EventBus;
}

async function buildHandler(deps: {
  repo: ReturnType<typeof makeRepo>;
  gl: GlPostingService;
  bus: EventEmitter2;
  cqrsBus?: EventBus;
}): Promise<RecordPaymentHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RecordPaymentHandler,
      { provide: FINANCE_REPO, useValue: deps.repo },
      { provide: GlPostingService, useValue: deps.gl },
      { provide: EventEmitter2, useValue: deps.bus },
      { provide: EventBus, useValue: deps.cqrsBus ?? makeEventBus() },
    ],
  }).compile();
  return module.get(RecordPaymentHandler);
}

describe('RecordPaymentHandler', () => {
  const date = new Date('2026-05-15');

  it('returns NOT_FOUND when invoice does not exist', async () => {
    const handler = await buildHandler({
      repo: makeRepo(null), gl: makeGl(), bus: makeEmitter(),
    });

    const result = await handler.execute(
      new RecordPaymentCommand(1, 999, 42, 500_000, date, 7),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects overpayment when amount exceeds remaining (pre-check)', async () => {
    const handler = await buildHandler({
      repo: makeRepo(makeInvoiceRow({ total_amount: '500000', paid_amount: '200000' })),
      gl: makeGl(),
      bus: makeEmitter(),
    });

    const result = await handler.execute(
      new RecordPaymentCommand(1, 501, 42, 400_000, date, 7),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/Ortiqcha/);
  });

  it('marks invoice fully paid when payment closes the balance', async () => {
    const repo = makeRepo(makeInvoiceRow({ total_amount: '1000000', paid_amount: '300000' }));
    const gl = makeGl();
    const bus = makeEmitter();
    const handler = await buildHandler({ repo, gl, bus });

    const result = await handler.execute(
      new RecordPaymentCommand(50, 501, 42, 700_000, date, 7),
    );

    expect(result.ok).toBe(true);
    expect(repo.recordPayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', paymentId: 50 }),
      null,
    );
    expect(gl.postCustomerPayment).toHaveBeenCalled();
  });

  it('records partial when payment is below remaining balance', async () => {
    const repo = makeRepo(makeInvoiceRow({ total_amount: '1000000', paid_amount: '0' }));
    const handler = await buildHandler({ repo, gl: makeGl(), bus: makeEmitter() });

    const result = await handler.execute(
      new RecordPaymentCommand(60, 501, 42, 300_000, date, 7),
    );

    expect(result.ok).toBe(true);
    expect(repo.recordPayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'partial', amount: 300_000 }),
      null,
    );
  });

  it('returns Err when GL posting fails, and compensates by reversing the payment+invoice', async () => {
    const repo = makeRepo(makeInvoiceRow({ total_amount: '1000000', paid_amount: '0' }));
    const handler = await buildHandler({
      repo, gl: makeGl(false), bus: makeEmitter(),
    });

    const result = await handler.execute(
      new RecordPaymentCommand(70, 501, 42, 1_000_000, date, 7),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/GL posting failed/);
    // C1: the payment+invoice tx already committed before the GL call — a GL failure must be
    // explicitly compensated (GlPostingService cannot join the outer transaction).
    expect(repo.reverseInvoicePayment).toHaveBeenCalledWith(
      expect.any(Number), 501, 1_000_000,
    );
  });

  it('emits invoice domain events through the event bus', async () => {
    const repo = makeRepo(makeInvoiceRow({ total_amount: '1000000', paid_amount: '0' }));
    const bus = makeEmitter();
    const handler = await buildHandler({ repo, gl: makeGl(), bus });

    await handler.execute(
      new RecordPaymentCommand(80, 501, 42, 1_000_000, date, 7),
    );

    expect((bus.emit as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });

  describe('C1 — concurrency / idempotency', () => {
    it('two concurrent payments on the same invoice cannot both succeed past the overpay guard', async () => {
      // Invoice: total=1,000,000, paid=0. Two concurrent requests for 700,000 each (combined
      // 1,400,000 > 1,000,000). Both pass the stale pre-check (each individually <= 1,000,000
      // against the SAME snapshot); only the atomic guard inside the transaction can catch this.
      const row = makeInvoiceRow({ total_amount: '1000000', paid_amount: '0' });
      const guard = makeStatefulGuard(1_000_000, 0);
      const repoA = makeRepo(row, { guard });
      const repoB = makeRepo(row, { guard }); // same underlying guard state — same "invoice row"
      const handlerA = await buildHandler({ repo: repoA, gl: makeGl(), bus: makeEmitter() });
      const handlerB = await buildHandler({ repo: repoB, gl: makeGl(), bus: makeEmitter() });

      const [resultA, resultB] = await Promise.all([
        handlerA.execute(new RecordPaymentCommand(201, 501, 42, 700_000, date, 7)),
        handlerB.execute(new RecordPaymentCommand(202, 501, 42, 700_000, date, 7)),
      ]);

      const results = [resultA, resultB];
      const succeeded = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);
      if (!failed[0].ok) expect(failed[0].error.message).toMatch(/Ortiqcha/);
      // Exactly one payment's worth was ever applied to the invoice — no lost update, no double-spend.
      expect(guard.state.paidAmount).toBe(700_000);
    });

    it('a retry with the same idempotency key returns the original payment without reprocessing', async () => {
      const repo = makeRepo(makeInvoiceRow({ total_amount: '1000000', paid_amount: '0' }));
      (repo.findPaymentByIdempotencyKey as jest.Mock).mockResolvedValueOnce(Ok(null)).mockResolvedValue(Ok({ id: 999 }));
      const handler = await buildHandler({ repo, gl: makeGl(), bus: makeEmitter() });

      const first = await handler.execute(
        new RecordPaymentCommand(90, 501, 42, 500_000, date, 7, 'idem-key-abc'),
      );
      const retry = await handler.execute(
        new RecordPaymentCommand(90, 501, 42, 500_000, date, 7, 'idem-key-abc'),
      );

      expect(first.ok).toBe(true);
      expect(retry.ok).toBe(true);
      if (retry.ok) expect(retry.data).toBe(999);
      // The retry short-circuited before ever touching the guarded UPDATE again.
      expect(repo.applyInvoicePayment).toHaveBeenCalledTimes(1);
    });
  });
});
