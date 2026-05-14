/**
 * @module release-production-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository } from '../../domain/repositories/pp.repository';

export class ReleaseProductionOrderCommand {
  constructor(public poId: number) {}
}

@CommandHandler(ReleaseProductionOrderCommand)
export class ReleaseProductionOrderHandler
  implements ICommandHandler<ReleaseProductionOrderCommand>
{
  private readonly logger = new Logger(ReleaseProductionOrderHandler.name);
  constructor(
    @Inject('IPpRepository') private ppRepo: IPpRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ReleaseProductionOrderCommand): Promise<Result<void>> {
    this.logger.log('Releasing production order');

    const poResult = await this.ppRepo.getPo(command.poId);
    if (!poResult.ok) {
      return Err(poResult.error);
    }

    const po = poResult.data;
    const releaseResult = po.release();
    if (!releaseResult.ok) {
      return Err(releaseResult.error);
    }

    // Trigger 8: PP released → MM/WMS material reservation
    const saveResult = await this.ppRepo.savePo(po);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // Emit events for MES task creation
    this.eventBus.publish({
      type: 'PP_RELEASED_TO_PRODUCTION',
      data: { poId: command.poId, materialList: po.getMaterialList() },
    });

    this.logger.log('Production order released');
    return Ok(undefined);
  }
}
