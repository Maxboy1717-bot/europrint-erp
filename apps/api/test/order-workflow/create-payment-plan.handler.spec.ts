/**
 * test/order-workflow/create-payment-plan.handler.spec.ts
 * Unit tests for CreatePaymentPlanHandler. `db.delete/insert` mocked.
 * The IOrderRepo is mocked; OrderAggregate is real.
 */

jest.mock('@shared/db', () => ({
  db: {
    delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) }),
  },
  owPaymentPlanEntries: { orderId: 'orderId' },
  owOrders: {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentPlanHandler, CreatePaymentPlanCommand, PaymentEntryInput } from '../../src/modules/order-workflow/application/commands/create-payment-plan.handler';
import { ORDER_WF_REPO } from '../../src/modules/order-workflow/infrastructure/repositories/i-order.repo';
import { OrderAggregate } from '../../src/modules/order-workflow/domain/aggregates/order.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  save: jest.Mock; findById: jest.Mock; findAll: jest.Mock;
}
function makeRepo(): RepoMock {
  return { save: jest.fn(), findById: jest.fn(), findAll: jest.fn() };
}

function makeOrder(): OrderAggregate {
  const r = OrderAggregate.create({
    id: 'order-1', orderNumber: 'OW-1', customerId: 5,
    totalAmount: 10_000_000, currency: 'UZS',
  });
  if (!r.ok) throw new Error('test setup');
  return r.data;
}

function makeCmd(entries: PaymentEntryInput[]): CreatePaymentPlanCommand {
  return new CreatePaymentPlanCommand('order-1', entries, 1);
}

describe('CreatePaymentPlanHandler', () => {
  let handler: CreatePaymentPlanHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePaymentPlanHandler,
        { provide: ORDER_WF_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(CreatePaymentPlanHandler);
  });

  it('returns VALIDATION when entries list is empty', async () => {
    const r = await handler.execute(makeCmd([]));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('returns VALIDATION when entries exceed maximum of 10', async () => {
    const many: PaymentEntryInput[] = Array.from({ length: 11 }, (_, i) => ({
      sequence: i + 1, dueType: 'MILESTONE', percent: 100 / 11,
    }));

    const r = await handler.execute(makeCmd(many));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/maksimum/i);
  });

  it('returns VALIDATION when percentages do not sum to 100', async () => {
    const entries: PaymentEntryInput[] = [
      { sequence: 1, dueType: 'ADVANCE', percent: 30 },
      { sequence: 2, dueType: 'NET_30', percent: 40 },
    ];

    const r = await handler.execute(makeCmd(entries));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/100/);
  });

  it('returns NOT_FOUND when order does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));
    const entries: PaymentEntryInput[] = [
      { sequence: 1, dueType: 'ADVANCE', percent: 100 },
    ];

    const r = await handler.execute(makeCmd(entries));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns Ok with count when entries sum to 100 and order exists', async () => {
    repo.findById.mockResolvedValue(Ok(makeOrder()));
    const entries: PaymentEntryInput[] = [
      { sequence: 1, dueType: 'ADVANCE', percent: 60 },
      { sequence: 2, dueType: 'ON_DELIVERY', percent: 40 },
    ];

    const r = await handler.execute(makeCmd(entries));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.count).toBe(2);
  });

  it('propagates repo error when findById fails', async () => {
    repo.findById.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));
    const entries: PaymentEntryInput[] = [
      { sequence: 1, dueType: 'ADVANCE', percent: 100 },
    ];

    const r = await handler.execute(makeCmd(entries));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
