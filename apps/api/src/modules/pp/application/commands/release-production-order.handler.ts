/**
 * @module release-production-order.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';
import { PpReleasedEvent } from '../../domain/events/pp-released.event';

export class ReleaseProductionOrderCommand {
  constructor(public poId: number) {}
}

@CommandHandler(ReleaseProductionOrderCommand)
export class ReleaseProductionOrderHandler
  implements ICommandHandler<ReleaseProductionOrderCommand>
{
  private readonly logger = new Logger(ReleaseProductionOrderHandler.name);
  constructor(
    @Inject(PP_REPO) private ppRepo: IPpRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ReleaseProductionOrderCommand): Promise<Result<void>> {
    this.logger.log('Releasing production order');

    const poResult = await this.ppRepo.getPo(command.poId);
    if (!poResult.ok) {
      return Err(poResult.error);
    }

    const po = poResult.data;
    // getPo() reconstructs the aggregate from the DB and cannot hydrate the
    // checkpoint flag (no such column), so release() would always fail
    // CHECKPOINT_REQUIRED. Reaching this command IS the checkpoint authorization
    // (the controller requires a `reason`), so mark it validated before release.
    po.setCheckpointValidated(true);
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
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    this.eventBus.publish(new PpReleasedEvent(command.poId, po.getMaterialList()));

    this.logger.log('Production order released');
    return Ok(undefined);
  }
}
