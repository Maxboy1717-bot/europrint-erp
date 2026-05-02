import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Result, Ok, Err } from '@common/types/result.type';
import { Inject, Logger } from '@nestjs/common';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';
import { SoStatus } from '../../domain/value-objects/so-status.vo';
import { Money } from '@shared/domain/value-objects/money.vo';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';

export class CreateOrderCommand {
  constructor(public readonly companyId: number,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly designFlag: boolean = false,
    public readonly sampleFlag: boolean = false,
    public readonly createdBy: number = 1,
    public readonly dealId?: number) {}
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);
  constructor(
    @Inject('ISalesOrderRepository') private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
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

    const orderNumber = `SO-${Date.now()}`;
    const order = SalesOrder.create({
      orderNumber,
      status: statusResult.data,
      companyId: command.companyId,
      totalAmount: money,
      designFlag: command.designFlag,
      sampleFlag: command.sampleFlag,
      createdBy: command.createdBy,
    } as never);

    const saveResult = await this.orderRepo.save(order);
    if (!saveResult.ok) {
      this.logger.error({ msg: 'Failed to save order', error: saveResult.error });
      return Err('Failed to save order');
    }

    const savedOrder = (saveResult).data as SalesOrder;

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
}
