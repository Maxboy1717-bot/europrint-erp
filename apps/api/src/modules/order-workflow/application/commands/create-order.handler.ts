/**
 * @module create-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/types/result.type';
import { OrderAggregate } from '../../domain/aggregates/order.aggregate';
import { IOrderRepo, ORDER_WF_REPO } from '../../infrastructure/repositories/i-order.repo';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import { owOrders, owOrderStatusHistory } from '@shared/db';

const ORDER_NUMBER_PREFIX = 'OW';
const INITIAL_STATUS     = 'LEAD_INTAKE';

export class CreateOrderCommand {
  constructor(
    public readonly customerId:            number | null,
    public readonly totalAmount:           number | undefined,
    public readonly currency:              string | undefined,
    public readonly assignedSalesManager:  number | null,
    public readonly createdBy:             number,
    public readonly tenantId:              string | null = null,
  ) {}
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    @Inject(ORDER_WF_REPO) private readonly repo: IOrderRepo,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: CreateOrderCommand): Promise<Result<OrderAggregate>> {
    const id          = uuidv4();
    const orderNumber = `${ORDER_NUMBER_PREFIX}-${Date.now()}`;

    const createResult = OrderAggregate.create({
      id,
      orderNumber,
      customerId:           command.customerId,
      totalAmount:          command.totalAmount ?? 0,
      currency:             command.currency ?? 'UZS',
      assignedSalesManager: command.assignedSalesManager ?? command.createdBy,
      tenantId:             command.tenantId,
    });
    if (!createResult.ok) return Err(createResult.error);

    const order = createResult.data;

    const transResult = order.transition(INITIAL_STATUS);
    if (!transResult.ok) {
      this.logger.warn({ msg: 'DRAFT→LEAD_INTAKE o\'tish mumkin emas', id, err: transResult.error });
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(owOrders).values({
          id:                   order.getId(),
          orderNumber:          order.getOrderNumber(),
          customerId:           order.getCustomerId(),
          customerTier:         order.getCustomerTier(),
          status:               order.getStatus(),
          stateVersion:         order.getStateVersion(),
          totalAmount:          String(order.getTotalAmount()),
          currency:             order.getCurrency(),
          assignedSalesManager: order.getSalesManager(),
          tenantId:             order.getTenantId() ?? undefined,
        });

        if (transResult.ok) {
          await tx.insert(owOrderStatusHistory).values({
            orderId:      id,
            fromStatus:   'DRAFT',
            toStatus:     INITIAL_STATUS,
            changedBy:    command.createdBy,
            reason:       'Avtomatik yaratish',
            stateVersion: order.getStateVersion(),
          });
        }
      });
    } catch (e) {
      this.logger.error({ msg: 'Buyurtma yaratish xatosi', err: String(e) });
      return Err(AppErr('DB_ERROR', 'Buyurtma saqlanmadi'));
    }

    this.logger.log({ msg: 'Buyurtma yaratildi', id, orderNumber, status: order.getStatus(), actor: command.createdBy });
    this.events.emit('order.status_changed', new OrderStatusChangedEvent(
      id, orderNumber, 'DRAFT', order.getStatus(), command.createdBy, new Date(),
    ));

    return Ok(order);
  }
}
