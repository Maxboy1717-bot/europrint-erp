/**
 * test/finance/record-payment.handler.spec.ts
 *
 * Unit tests for RecordPaymentHandler. FinanceRepository, GlPostingService
 * and EventEmitter2 are mocked; the Invoice aggregate is real.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '@nestjs/cqrs';
import {
  RecordPaymentHandler,
  RecordPaymentCommand,
} from '../../src/modules/finance/application/commands/record-payment.handler';
import { FINANCE_REPO } from '../../src/modules/finance/domain/repositories/i-finance.repo';
import { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import { Ok, Err, AppErr } from '../../src/common/result';

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

function makeRepo(row: InvoiceRow | null) {
  return {
    findInvoiceById: jest.fn().mockResolvedValue(
      row ? Ok(row) : Err(AppErr('NOT_FOUND', 'Invoice not found')),
    ),
    recordPayment: jest.fn().mockResolvedValue(undefined),
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

  it('rejects overpayment when amount exceeds remaining', async () => {
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
    );
    expect(gl.postCustomerPayment).toHaveBeenCalledWith(50, 700_000);
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
    );
  });

  it('returns Err when GL posting fails on full payment', async () => {
    const repo = makeRepo(makeInvoiceRow({ total_amount: '1000000', paid_amount: '0' }));
    const handler = await buildHandler({
      repo, gl: makeGl(false), bus: makeEmitter(),
    });

    const result = await handler.execute(
      new RecordPaymentCommand(70, 501, 42, 1_000_000, date, 7),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/GL posting failed/);
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
});
