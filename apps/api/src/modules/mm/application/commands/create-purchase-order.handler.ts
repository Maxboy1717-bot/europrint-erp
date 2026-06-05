/**
 * @module create-purchase-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { PurchaseOrder, PurchaseOrderItem } from '../../domain/aggregates/purchase-order.aggregate';
import { IMmRepository, MM_REPO } from '../../domain/repositories/mm.repository';
import { PO_MAX_AMOUNT_UZS } from '@common/constants/app.constants';
import { PoRequiresDirectorApprovalEvent } from '../../domain/events/po-requires-director-approval.event';

export class CreatePurchaseOrderCommand {
  constructor(public supplierId: number,
    public items: { materialId: number; quantity: number; unitPrice: number }[],
    public createdBy: number) {}
}

@CommandHandler(CreatePurchaseOrderCommand)
export class CreatePurchaseOrderHandler
  implements ICommandHandler<CreatePurchaseOrderCommand>
{
  private readonly logger = new Logger(CreatePurchaseOrderHandler.name);
  constructor(
    @Inject(MM_REPO) private mmRepo: IMmRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CreatePurchaseOrderCommand): Promise<Result<number>> {
    this.logger.log('Creating purchase order');

    const poNumber = `PO-${Date.now()}`;
    const po = new PurchaseOrder(0, poNumber, command.supplierId, command.createdBy);

    for (const item of command.items) {
      const poItem = new PurchaseOrderItem(item.materialId, item.quantity, item.unitPrice);
      const addResult = po.addItem(poItem);
      if (!addResult.ok) {
        return Err(addResult.error);
      }
    }

    const totalAmount = po.getTotalAmount();

    const saveResult = await this.mmRepo.savePurchaseOrder(po);
    if (!saveResult.ok) {
      return saveResult;
    }

    // §7 HITL: > 50 mln UZS → Director approval. Publish AFTER save so poId is the REAL saved id
    // (was a STRING event published BEFORE save with poId=0 — unroutable by CQRS + wrong id). The
    // class event is handled by PoRequiresDirectorApprovalListener → hitl_approvals (director reads it).
    if (totalAmount > PO_MAX_AMOUNT_UZS) {
      this.logger.log({ poNumber, totalAmount, createdBy: command.createdBy }, 'HITL required: PO exceeds 50 million UZS');
      this.eventBus.publish(new PoRequiresDirectorApprovalEvent(saveResult.data, totalAmount, command.createdBy));
    }

    this.logger.log('Purchase order created');
    return saveResult;
  }
}
