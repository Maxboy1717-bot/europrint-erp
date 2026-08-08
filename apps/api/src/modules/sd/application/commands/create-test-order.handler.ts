/**
 * @module create-test-order.handler
 * @description CQRS command handler — A13 golden-thread seed.
 *
 * Creates ONE clearly-marked `TEST-` sales order and emits the canonical
 * `sd.order.created` (= ERP_EVENTS.ORDER_CREATED) event through the outbox.
 *
 * WHY a separate handler (file isolation, not a fork of CreateOrderHandler):
 *   - The first golden-thread "card"/order is openly labelled `TEST-` per the
 *     owner decision (the first thread carries a `TEST-` marker). This handler
 *     is the explicit, auditable entry point for laying that first thread
 *     SD→PP→MES→QC→WMS→FIN without polluting the real customer-facing
 *     CreateOrderHandler with test concerns.
 *   - It REUSES the existing infrastructure: SALES_ORDER_REPO (real INSERT into
 *     sales_orders) + OutboxRepository (real INSERT into domain_events). No new
 *     tables, no fabricated data — the order is honestly a TEST row, the event
 *     payload is real. The A14 outbox publisher then re-emits the persisted
 *     event after commit.
 *
 * Atomicity (mirrors CreateOrderHandler / PA0-6): the order header INSERT and
 * the outbox INSERT share ONE db.transaction — if either fails, both roll back,
 * so a "saved order without event" state is impossible.
 *
 * No `throw new Error` leaks to callers — returns Result<T> per Rule 1.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, Ok, Err } from '@common/types/result.type';
import { Inject, Logger } from '@nestjs/common';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';
import { SoStatus } from '../../domain/value-objects/so-status.vo';
import { Money } from '@common/money/money.vo';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { OutboxRepository } from '../../../shared/outbox/outbox.repository';
import { db } from '@shared/db';

/** Prefix that openly marks the first golden-thread order as a test seed. */
export const TEST_ORDER_PREFIX = 'TEST-';

/**
 * Command to create one TEST- sales order. All inputs default to safe, openly
 * test-only values; callers may override the amount/company for a richer seed.
 */
export class CreateTestOrderCommand {
  constructor(
    public readonly companyId: number = 1,
    public readonly totalAmount: number = 1_000_000,
    public readonly currency: string = 'UZS',
  ) {}
}

export interface CreateTestOrderResult {
  orderId: number;
  orderNumber: string;
  eventName: string;
}

type OutboxRow = {
  aggregate_type: string;
  aggregate_id: string;
  event_name: string;
  payload: Record<string, unknown>;
};

@CommandHandler(CreateTestOrderCommand)
export class CreateTestOrderHandler implements ICommandHandler<CreateTestOrderCommand> {
  private readonly logger = new Logger(CreateTestOrderHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(command: CreateTestOrderCommand): Promise<Result<CreateTestOrderResult>> {
    const statusResult = SoStatus.create('draft');
    if (!statusResult.ok) {
      return Err('Invalid status');
    }

    const money = Money.of(command.totalAmount, command.currency ?? 'UZS');
    const orderNumber = this._generateTestOrderNumber();

    // createdBy = 0: this is a system-seeded TEST order with no real human
    // author (the repo maps a non-positive creator to a NULL uuid column,
    // matching the existing seed rows). No fabricated user id is invented.
    const order = SalesOrder.create({
      orderNumber,
      status: statusResult.data,
      companyId: command.companyId,
      totalAmount: money,
      designFlag: false,
      sampleFlag: false,
      createdBy: 0,
    });

    type TxResult = { kind: 'ok'; saved: SalesOrder };
    let txOutcome: TxResult;
    try {
      txOutcome = await db.transaction(async (tx): Promise<TxResult> => {
        const saveResult = await this.orderRepo.save(order, tx);
        if (!saveResult.ok) {
          throw new Error(saveResult.error?.message ?? 'Failed to save TEST order');
        }
        const savedOrder = saveResult.data as SalesOrder;

        const outboxRows = this._buildOutboxEntries(savedOrder, orderNumber, command);
        const outboxInsert = await this.outboxRepo.insertBatch(outboxRows, tx);
        if (!outboxInsert.ok) {
          // Roll back the order INSERT — the event must never go missing.
          throw new Error(`Outbox insert failed: ${outboxInsert.error.message}`);
        }
        savedOrder.clearDomainEvents();
        return { kind: 'ok', saved: savedOrder };
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Transaction failed';
      this.logger.error({ msg: 'TEST order save transaction rolled back', error: message });
      return Err('Failed to save TEST order');
    }

    const savedOrder = txOutcome.saved;
    this.logger.log({
      msg: 'TEST sales order created (golden-thread seed)',
      orderId: savedOrder.getId(),
      orderNumber,
      event: ERP_EVENTS.ORDER_CREATED,
    });

    return Ok({
      orderId: savedOrder.getId(),
      orderNumber,
      eventName: ERP_EVENTS.ORDER_CREATED,
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────

  /** `TEST-SO-2026-1718...` — the `TEST-` prefix makes the seed unmistakable. */
  private _generateTestOrderNumber(): string {
    const year = new Date().getFullYear();
    return `${TEST_ORDER_PREFIX}SO-${year}-${Date.now()}`;
  }

  private _buildOutboxEntries(
    savedOrder: SalesOrder,
    orderNumber: string,
    command: CreateTestOrderCommand,
  ): OutboxRow[] {
    // Carry any domain events the aggregate raised (kept for parity with the
    // real CreateOrderHandler), then synthesise the canonical OrderCreated
    // entry the golden-thread listeners (A14 outbox publisher) wait on.
    const aggregateEvents = savedOrder.getDomainEvents();
    const outboxRows: OutboxRow[] = aggregateEvents.map((e) => {
      const raw = e as unknown as { eventName?: string; data?: Record<string, unknown> };
      return {
        aggregate_type: 'SalesOrder',
        aggregate_id: String(savedOrder.getId()),
        event_name: raw.eventName ?? 'UnknownEvent',
        payload: (raw.data ?? {}) as Record<string, unknown>,
      };
    });

    outboxRows.push({
      aggregate_type: 'SalesOrder',
      aggregate_id: String(savedOrder.getId()),
      event_name: ERP_EVENTS.ORDER_CREATED, // 'sd.order.created'
      payload: {
        orderId: savedOrder.getId(),
        companyId: command.companyId,
        orderNumber,
        totalAmount: command.totalAmount,
        test: true,
        at: _time.now().toISOString(),
      },
    });

    return outboxRows;
  }
}
