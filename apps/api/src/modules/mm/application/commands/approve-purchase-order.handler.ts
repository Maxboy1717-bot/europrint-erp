/**
 * @module approve-purchase-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Err , Ok } from '@common/result';
import { Inject, BadRequestException, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IMmRepository } from '../../domain/repositories/mm.repository';

export class ApprovePurchaseOrderCommand {
  constructor(public poId: number, public approvedBy: number) {}
}

@CommandHandler(ApprovePurchaseOrderCommand)
export class ApprovePurchaseOrderHandler
  implements ICommandHandler<ApprovePurchaseOrderCommand>
{
  private readonly logger = new Logger(ApprovePurchaseOrderHandler.name);
  constructor(
    @Inject('IMmRepository') private mmRepo: IMmRepository
  ) {}

  async execute(command: ApprovePurchaseOrderCommand): Promise<Result<void>> {
    this.logger.log('Approving PO');

    const poResult = await this.mmRepo.getPurchaseOrder(command.poId);
    if (!poResult.ok) {
      return Err(poResult.error);
    }

    const po = poResult.data;

    // §6 SoD: creator !== approver tekshiruvi
    if (po.getCreatedBy() === command.approvedBy) {
      return Err('Yaratuvchi va tasdiqlash o\'tkazuvchi boshqa bo\'lishi kerak (SoD)');
    }

    const approveResult = po.approve(command.approvedBy);
    if (!approveResult.ok) {
      return approveResult;
    }

    const saveResult = await this.mmRepo.savePurchaseOrder(po);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    this.logger.log('Purchase order approved');
    return Ok(undefined);
  }
}
