/**
 * @module create-production-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { ProductionOrder, MaterialRequirement } from '../../domain/aggregates/production-order.aggregate';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';

export class CreateProductionOrderCommand {
  constructor(public soId: number,
    public bomId: number,
    public routingId: number,
    public plannedStart: Date,
    public plannedEnd: Date,
    public checkpointValidated: boolean) {}
}

@CommandHandler(CreateProductionOrderCommand)
export class CreateProductionOrderHandler implements ICommandHandler<CreateProductionOrderCommand> {
  private readonly logger = new Logger(CreateProductionOrderHandler.name);
  constructor(
    @Inject(PP_REPO) private ppRepo: IPpRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: CreateProductionOrderCommand): Promise<Result<number>> {
    this.logger.log('Creating production order');

    // §8.2: 3-checkpoint validation
    if (!command.checkpointValidated) {
      this.logger.warn('Checkpoint validation failed');
      return Err('Uch checkpoint o\'tilishi kerak');
    }

    // Get BOM for MRP calculation
    const bomResult = await this.ppRepo.getBom(command.bomId);
    if (!bomResult.ok) {
      return Err(AppErr('NOT_FOUND', 'BOM topilmadi'));
    }

    // Create production order
    const po = new ProductionOrder(
      0,
      command.soId,
      command.bomId,
      command.routingId,
      command.plannedStart,
      command.plannedEnd,
    );
    po.setCheckpointValidated(true);

    // Calculate MRP: Add material requirements from BOM
    bomResult.data.getItems().forEach((item) => {
      const matReq = new MaterialRequirement(item.materialId, item.getNetQuantity());
      po.addMaterialRequirement(matReq);
    });

    const saveResult = await this.ppRepo.savePo(po);
    if (!saveResult.ok) {
      return saveResult;
    }

    this.logger.log('Production order created successfully');
    return saveResult;
  }
}
