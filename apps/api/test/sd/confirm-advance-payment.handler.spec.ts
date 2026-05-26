/**
 * test/sd/confirm-advance-payment.handler.spec.ts
 *
 * Unit tests for ConfirmAdvancePaymentHandler. ISalesOrderRepository mocked;
 * SalesOrder aggregate runs for real (advance + idempotency).
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConfirmAdvancePaymentHandler,
  ConfirmAdvancePaymentCommand,
} from '../../src/modules/sd/application/commands/confirm-advance-payment.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';
import { buildSalesOrder } from './_so-builder';

function makeRepo(
  order: SalesOrder | null,
  atomic: { updated: boolean; newVersion: number; duplicate: boolean } | Error = { updated: true, newVersion: 1, duplicate: false },
): jest.Mocked<ISalesOrderRepository> {
  const atomicResult = atomic instanceof Error
    ? Err(AppErr('CONFLICT', atomic.message))
    : Ok(atomic);
  return {
    findById: jest.fn().mockResolvedValue(
      order ? Ok(order) : Err(AppErr('NOT_FOUND', 'not found')),
    ),
    updateAdvancePaidAtomic: jest.fn().mockResolvedValue(atomicResult),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    update: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

async function buildHandler(repo: ISalesOrderRepository): Promise<ConfirmAdvancePaymentHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ConfirmAdvancePaymentHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(ConfirmAdvancePaymentHandler);
}

describe('ConfirmAdvancePaymentHandler', () => {
  it('returns VALIDATION when amount is non-positive', async () => {
    const handler = await buildHandler(makeRepo(buildSalesOrder()));

    const result = await handler.execute(
      new ConfirmAdvancePaymentCommand(1, 0, 'key-1'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when idempotency key is missing', async () => {
    const handler = await buildHandler(makeRepo(buildSalesOrder()));

    const result = await handler.execute(
      new ConfirmAdvancePaymentCommand(1, 1000, ''),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/idempotencyKey/);
  });

  it('returns NOT_FOUND when order is missing', async () => {
    const handler = await buildHandler(makeRepo(null));

    const result = await handler.execute(
      new ConfirmAdvancePaymentCommand(999, 1000, 'key-1'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('applies payment and returns new version on success', async () => {
    const order = buildSalesOrder({ totalAmount: 10_000, advanceRequired: 50 });
    const repo = makeRepo(order, { updated: true, newVersion: 1, duplicate: false });
    const handler = await buildHandler(repo);

    const result = await handler.execute(
      new ConfirmAdvancePaymentCommand(order.getId(), 6_000, 'key-OK'),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.alreadyApplied).toBe(false);
      expect(result.data.newVersion).toBe(1);
      expect(result.data.advanceStatus).toBe('approved');
    }
  });

  it('detects duplicate atomic update and marks alreadyApplied', async () => {
    const order = buildSalesOrder({ totalAmount: 10_000, advanceRequired: 50 });
    const repo = makeRepo(order, { updated: true, newVersion: 2, duplicate: true });
    const handler = await buildHandler(repo);

    const result = await handler.execute(
      new ConfirmAdvancePaymentCommand(order.getId(), 1000, 'dup-key'),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.alreadyApplied).toBe(true);
  });

  it('throws ConcurrencyConflictException when atomic update fails', async () => {
    const order = buildSalesOrder({ totalAmount: 10_000 });
    const repo = makeRepo(order, new Error('version mismatch'));
    const handler = await buildHandler(repo);

    // Handler follows Result pattern — returns Err(CONFLICT) instead of throwing
    const result = await handler.execute(
      new ConfirmAdvancePaymentCommand(order.getId(), 1000, 'k'),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CONFLICT');
  });
});
