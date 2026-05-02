import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { Delivery } from '../../domain/aggregates/delivery.aggregate';
import { IDeliveryRepo, DELIVERY_REPO } from '../../domain/repositories/i-delivery.repo';

@Injectable()
export class SalesOrderConfirmedListener {
  private readonly logger = new Logger(SalesOrderConfirmedListener.name);

  constructor(
    @Inject(DELIVERY_REPO) private readonly deliveryRepo: IDeliveryRepo,
      ) {}

  @OnEvent(ERP_EVENTS.ORDER_CREATED)
  @OnEvent(ERP_EVENTS.ORDER_STATUS_CHANGED)
  async handleOrderConfirmed(payload: {
    orderId?: string;
    salesOrderId?: string;
    customerName: string;
    deliveryAddress: string;
    status?: string;
  }) {
    // Only create delivery if order is confirmed
    if (payload.status && payload.status !== 'confirmed') {
      return;
    }

    const salesOrderId = payload.salesOrderId || payload.orderId;

    if (!salesOrderId) {
      this.logger.warn('Sales order ID missing from event');
      return;
    }

    this.logger.log(
      { salesOrderId, customerName: payload.customerName },
      'Sales order confirmed - auto-creating delivery record',
    );

    // Check if delivery already exists for this sales order
    const existingResult = await this.deliveryRepo.findBySalesOrderId(salesOrderId);

    if (existingResult.ok && existingResult.data) {
      this.logger.log('Delivery already exists for this sales order');
      return;
    }

    // Create new delivery
    const delivery = Delivery.createForSalesOrder(payload.customerName, payload.deliveryAddress);
    delivery.salesOrderId = salesOrderId;

    // Save to database
    const saveResult = await this.deliveryRepo.save(delivery);

    if (!saveResult.ok) {
      this.logger.error(
        { salesOrderId, error: saveResult.error },
        'Failed to create delivery record',
      );
      return;
    }

    this.logger.log(
      {
        deliveryId: saveResult.data.id,
        deliveryNumber: saveResult.data.deliveryNumber,
        salesOrderId,
      },
      'Delivery record auto-created from sales order confirmation',
    );
  }
}
