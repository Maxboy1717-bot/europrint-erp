/**
 * test/integration/triggers/payment-to-order-closed.spec.ts
 *
 * Trigger 15: payment.full -> PaymentReceivedListener -> UpdateOrderStatusCommand
 * The repository and CommandBus are mocked; the listener gates closure by the
 * current SO status, so each test sets order.getStatus() explicitly.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentReceivedListener } from '../../../src/modules/sd/infrastructure/event-handlers/payment-received.listener';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { UpdateOrderStatusCommand } from '../../../src/modules/sd/application/commands/update-order-status.handler';
import { InvoiceFullyPaidEvent } from '../../../src/modules/finance/domain/events/invoice-fully-paid.event';
import { Ok, Err, AppErr } from '../../../src/common/result';

type CommandBusMock = { execute: jest.Mock };

interface OrderLike {
  getStatus(): string;
}

function makeRepo(order: OrderLike | null): jest.Mocked<ISalesOrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(
      order ? Ok(order) : Err(AppErr('NOT_FOUND', 'Order not found')),
    ),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    update: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

/** Build a typed InvoiceFullyPaidEvent from legacy {orderId, amount} shape */
function makeEvent(orderId: number, amount: number): InvoiceFullyPaidEvent {
  return new InvoiceFullyPaidEvent({
    invoiceId:  orderId,
    customerId: 1,
    totalAmount: amount,
    paidAt: new Date(),
  });
}

async function buildListener(
  repo: ISalesOrderRepository,
  commandBus: CommandBusMock,
): Promise<PaymentReceivedListener> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      PaymentReceivedListener,
      { provide: SALES_ORDER_REPO, useValue: repo },
      { provide: CommandBus, useValue: commandBus },
    ],
  }).compile();
  return moduleRef.get(PaymentReceivedListener);
}

describe('Trigger 15: PaymentFull -> SalesOrder closed', () => {
  let commandBus: CommandBusMock;

  beforeEach(() => {
    commandBus = { execute: jest.fn().mockResolvedValue(Ok(undefined)) };
  });

  it('closes order when status is delivered and full payment arrives', async () => {
    const order: OrderLike = { getStatus: () => 'delivered' };
    const repo = makeRepo(order);
    const listener = await buildListener(repo, commandBus);

    await listener.handle(makeEvent(42, 1_500_000));

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const cmd: UpdateOrderStatusCommand = commandBus.execute.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(UpdateOrderStatusCommand);
    expect(cmd.orderId).toBe(42);
    expect(cmd.newStatus).toBe('closed');
  });

  it('defers closure when payment arrives before delivery', async () => {
    const order: OrderLike = { getStatus: () => 'in_production' };
    const repo = makeRepo(order);
    const listener = await buildListener(repo, commandBus);

    await listener.handle(makeEvent(43, 1_000_000));

    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(repo.findById).toHaveBeenCalledWith(43);
  });

  it('skips closure when order lookup fails', async () => {
    const repo = makeRepo(null);
    const listener = await buildListener(repo, commandBus);

    await listener.handle(makeEvent(999, 500_000));

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('does not bypass status guard when order is already closed', async () => {
    const order: OrderLike = { getStatus: () => 'closed' };
    const repo = makeRepo(order);
    const listener = await buildListener(repo, commandBus);

    await listener.handle(makeEvent(44, 700_000));

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('swallows downstream errors when CommandBus rejects', async () => {
    const order: OrderLike = { getStatus: () => 'delivered' };
    const repo = makeRepo(order);
    commandBus.execute.mockRejectedValueOnce(new Error('bus down'));
    const listener = await buildListener(repo, commandBus);

    await expect(
      listener.handle(makeEvent(45, 800_000)),
    ).resolves.toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });
});
