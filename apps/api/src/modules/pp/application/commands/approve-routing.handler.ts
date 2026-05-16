/**
 * @module approve-routing.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';

export class ApproveRoutingCommand {
  constructor(public routingId: number, public approvedBy: number) {}
}

@CommandHandler(ApproveRoutingCommand)
export class ApproveRoutingHandler implements ICommandHandler<ApproveRoutingCommand> {
  private readonly logger = new Logger(ApproveRoutingHandler.name);
  constructor(
    @Inject(PP_REPO) private ppRepo: IPpRepository
  ) {}

  async execute(command: ApproveRoutingCommand): Promise<Result<void>> {
    this.logger.log(
      { routingId: command.routingId, approvedBy: command.approvedBy },
      'Approving routing',
    );

    const routingResult = await this.ppRepo.getRouting(command.routingId);
    if (!routingResult.ok) {
      return Err(routingResult.error);
    }

    const routing = routingResult.data;
    const approveResult = routing.approve(command.approvedBy);
    if (!approveResult.ok) {
      return approveResult;
    }

    // §8.2 Checkpoint 2: Routing approved
    const saveResult = await this.ppRepo.saveRouting(routing);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    this.logger.log('Routing approved - Checkpoint 2 completed');
    return Ok(undefined);
  }
}
