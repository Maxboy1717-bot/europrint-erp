/**
 * test/integration/triggers/advance-bypass-audit.spec.ts
 *
 * Trigger 20: ApproveAdvanceBypassHandler publishes `AdvanceBypassApproved`
 * on EventBus and records reason / bypassBy / orderId in the audit log.
 * The repository is mocked; the SalesOrder aggregate is real to exercise
 * domain invariants (§8.1 bypassAdvance).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  ApproveAdvanceBypassHandler,
  ApproveAdvanceBypassCommand,
} from '../../../src/modules/sd/application/commands/approve-advance-bypass.handler';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../../src/modules/sd/domain/repositories/i-sales-order.repo';
import { SalesOrder } from '../../../src/modules/sd/domain/aggregates/sales-order.aggregate';
import { Ok, Err, AppErr } from '../../../src/common/result';
import { buildSalesOrder } from '../../sd/_so-builder';

type EventBusMock = { publish: jest.Mock };

function makeRepo(
  order: SalesOrder | null,
  updateOk = true,
): jest.Mocked<ISalesOrderRepository> {
  return {
    findById: jest.fn().mockResolvedValue(
      order ? Ok(order) : Err(AppErr('NOT_FOUND', 'Order not found')),
    ),
    update: jest.fn().mockResolvedValue(
      updateOk ? Ok(undefined) : Err(AppErr('DB_ERROR', 'failed')),
    ),
    save: jest.fn(),
    findByOrderNumber: jest.fn(),
    findByCompanyId: jest.fn(),
    findByStatus: jest.fn(),
    findAll: jest.fn(),
    findPendingAdvanceOrders: jest.fn(),
    updateAdvancePaidWithLock: jest.fn(),
    updateAdvancePaidAtomic: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as unknown as jest.Mocked<ISalesOrderRepository>;
}

async function buildHandler(
  repo: ISalesOrderRepository,
  bus: EventBusMock,
): Promise<ApproveAdvanceBypassHandler> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      ApproveAdvanceBypassHandler,
      { provide: SALES_ORDER_REPO, useValue: repo },
      { provide: EventBus, useValue: bus },
    ],
  }).compile();
  return moduleRef.get(ApproveAdvanceBypassHandler);
}

describe('Trigger 20: AdvanceBypassApproved audit trail', () => {
  let bus: EventBusMock;

  beforeEach(() => {
    bus = { publish: jest.fn() };
  });

  it('publishes AdvanceBypassApproved event when bypass is approved', async () => {
    const order = buildSalesOrder({ advanceStatus: 'pending' });
    const handler = await buildHandler(makeRepo(order), bus);

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 99, 'CEO override'),
    );

    expect(result.ok).toBe(true);
    expect(bus.publish).toHaveBeenCalledTimes(1);
    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'AdvanceBypassApproved' }),
    );
  });

  it('records orderId, bypassBy and reason in the event payload', async () => {
    const order = buildSalesOrder({ advanceStatus: 'pending' });
    const handler = await buildHandler(makeRepo(order), bus);

    await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 42, 'special customer'),
    );

    const published = bus.publish.mock.calls[0][0];
    expect(published.data).toEqual(
      expect.objectContaining({
        orderId: order.getId(),
        bypassBy: 42,
        reason: 'special customer',
      }),
    );
    expect(published.aggregateId).toBe(order.getId());
    expect(published.timestamp).toBeInstanceOf(Date);
  });

  it('writes audit log entry when bypass succeeds', async () => {
    const order = buildSalesOrder({ advanceStatus: 'pending' });
    const handler = await buildHandler(makeRepo(order), bus);
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 7, 'audit-trace'),
    );

    const auditCall = logSpy.mock.calls.find(([arg]) => {
      const payload = arg as { msg?: string; reason?: string };
      return payload?.msg === 'Advance bypass approved' && payload.reason === 'audit-trace';
    });
    expect(auditCall).toBeDefined();
    const entry = auditCall?.[0] as {
      orderId: number;
      bypassBy: number;
      reason: string;
      timestamp: string;
    };
    expect(entry.orderId).toBe(order.getId());
    expect(entry.bypassBy).toBe(7);
    expect(typeof entry.timestamp).toBe('string');

    logSpy.mockRestore();
  });

  it('rejects bypass when reason is empty and does not publish event', async () => {
    const order = buildSalesOrder({ advanceStatus: 'pending' });
    const handler = await buildHandler(makeRepo(order), bus);

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 99, '   '),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION');
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('does not publish event when repository update fails', async () => {
    const order = buildSalesOrder({ advanceStatus: 'pending' });
    const handler = await buildHandler(makeRepo(order, false), bus);

    const result = await handler.execute(
      new ApproveAdvanceBypassCommand(order.getId(), 99, 'fail-path'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INTERNAL');
    expect(bus.publish).not.toHaveBeenCalled();
  });
});
