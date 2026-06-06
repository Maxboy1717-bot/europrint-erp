/**
 * @module create-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Result, Ok, Err } from '@common/types/result.type';
import { Inject, Logger } from '@nestjs/common';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';
import { SoStatus } from '../../domain/value-objects/so-status.vo';
import { Money } from '@common/money/money.vo';
import { CustomerId } from '@shared/domain/value-objects/customer-id.vo';
import { ISalesOrderRepository, SALES_ORDER_REPO, SalesOrderLineInput } from '../../domain/repositories/i-sales-order.repo';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { OutboxRepository } from '../../../shared/outbox/outbox.repository';
import { db } from '@shared/db';

export class CreateOrderCommand {
  constructor(public readonly companyId: number,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly designFlag: boolean = false,
    public readonly sampleFlag: boolean = false,
    public readonly createdBy: number = 1,
    public readonly dealId?: number,
    public readonly customerId?: number,
    public readonly items: SalesOrderLineInput[] = []) {}
}

type OutboxRow = {
  aggregate_type: string;
  aggregate_id: string;
  event_name: string;
  payload: Record<string, unknown>;
};

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);
  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<SalesOrder>> {
    this.logger.log({
      msg: 'Creating sales order',
      companyId: command.companyId,
      amount: command.totalAmount,
    });

    const money = Money.of(command.totalAmount, command.currency ?? 'UZS');

    const statusResult = SoStatus.create('draft');
    if (!statusResult.ok) {
      return Err('Invalid status');
    }

    // VO validation at the handler boundary: a raw numeric customerId from
    // the DTO is funnelled through `CustomerId.create` so the aggregate only
    // ever holds a validated VO.
    let customerId: CustomerId | undefined;
    if (command.customerId !== undefined) {
      const r = CustomerId.create(command.customerId);
      if (!r.ok) return Err(r.error);
      customerId = r.data;
    }

    const orderNumber = await this._generateOrderNumber();

    const order = SalesOrder.create({
      orderNumber,
      status: statusResult.data,
      companyId: command.companyId,
      customerId,
      totalAmount: money,
      designFlag: command.designFlag,
      sampleFlag: command.sampleFlag,
      createdBy: command.createdBy,
    });

    // PA0-6: aggregate save + outbox insert share ONE transaction. If either
    // write fails, both roll back — guaranteeing the "save without outbox"
    // gap is impossible. The outbox publisher (every 10s) will re-emit the
    // persisted events via EventEmitter2 after commit.
    type TxResult = { kind: 'ok'; saved: SalesOrder } | { kind: 'err'; message: string };
    let txOutcome: TxResult;
    try {
      txOutcome = await db.transaction(async (tx): Promise<TxResult> => {
        const saveResult = await this.orderRepo.save(order, tx);
        if (!saveResult.ok) {
          // Throw to roll back the transaction. The outer try/catch converts
          // this into a domain Result<Err>; no half-state can leak.
          throw new Error(saveResult.error?.message ?? 'Failed to save order');
        }
        const savedOrder = saveResult.data as SalesOrder;

        // STEP 3 — persist product-bound line-items in the SAME tx as the header + outbox.
        const itemsResult = await this.orderRepo.saveItems(savedOrder.getId(), command.items, tx);
        if (!itemsResult.ok) {
          throw new Error(itemsResult.error?.message ?? 'Failed to save order items');
        }

        const outboxRows = this._buildOutboxEntries(savedOrder, orderNumber, command);
        const outboxInsert = await this.outboxRepo.insertBatch(outboxRows, tx);
        if (!outboxInsert.ok) {
          // Roll back the order insert — the events must never go missing.
          throw new Error(
            `Outbox insert failed: ${outboxInsert.error.message}`,
          );
        }
        savedOrder.clearDomainEvents();
        return { kind: 'ok', saved: savedOrder };
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Transaction failed';
      this.logger.error({ msg: 'Order save transaction rolled back', error: message });
      return Err('Failed to save order');
    }

    if (txOutcome.kind === 'err') {
      this.logger.error({ msg: 'Failed to save order', error: txOutcome.message });
      return Err('Failed to save order');
    }
    const savedOrder = txOutcome.saved;

    // PA0-6 belt-and-suspenders: keep in-process CQRS emission alongside the
    // outbox publisher tick. Listeners using @OnEvent may fire twice for a
    // brief window (once from this direct publish via EventBridge, once from
    // the outbox publisher tick). Handlers are expected to be idempotent.
    if (command.designFlag) {
      this.eventBus.publish({
        aggregateId: savedOrder.getId(),
        eventName: 'DesignRequired',
        timestamp: _time.now(),
      });
    }

    if (command.sampleFlag) {
      this.eventBus.publish({
        aggregateId: savedOrder.getId(),
        eventName: 'SampleRequired',
        timestamp: _time.now(),
      });
    }

    const createdEvent = new OrderCreatedEvent(
      savedOrder.getId(),
      command.companyId,
      orderNumber,
      command.totalAmount,
    );
    this.eventBus.publish(createdEvent);

    this.logger.log({
      msg: 'Sales order created successfully',
      orderId: savedOrder.getId(),
      orderNumber,
    });

    return Ok(savedOrder);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async _generateOrderNumber(): Promise<string> {
    try {
      const seqRow = await this.orderRepo.count?.();
      const seqNum = seqRow?.ok ? (seqRow.data ?? 0) + 1 : Date.now();
      const year   = new Date().getFullYear();
      const padded = String(seqNum).padStart(6, '0');
      return `SO-${year}-${padded}`;
    } catch {
      return `SO-${Date.now()}`;
    }
  }

  private _buildOutboxEntries(
    savedOrder: SalesOrder,
    orderNumber: string,
    command: CreateOrderCommand,
  ): OutboxRow[] {
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

    // Synthesise OrderCreated outbox entry so listeners that wait on
    // ERP_EVENTS.ORDER_CREATED can pick it up after publisher tick.
    outboxRows.push({
      aggregate_type: 'SalesOrder',
      aggregate_id: String(savedOrder.getId()),
      event_name: ERP_EVENTS.ORDER_CREATED,
      payload: {
        orderId: savedOrder.getId(),
        companyId: command.companyId,
        orderNumber,
        totalAmount: command.totalAmount,
      },
    });

    if (command.designFlag) {
      outboxRows.push({
        aggregate_type: 'SalesOrder',
        aggregate_id: String(savedOrder.getId()),
        event_name: ERP_EVENTS.SO_DESIGN_REQUESTED,
        payload: { orderId: savedOrder.getId(), at: _time.now().toISOString() },
      });
    }

    if (command.sampleFlag) {
      outboxRows.push({
        aggregate_type: 'SalesOrder',
        aggregate_id: String(savedOrder.getId()),
        event_name: ERP_EVENTS.SO_SAMPLE_REQUESTED,
        payload: { orderId: savedOrder.getId(), at: _time.now().toISOString() },
      });
    }

    return outboxRows;
  }
}
