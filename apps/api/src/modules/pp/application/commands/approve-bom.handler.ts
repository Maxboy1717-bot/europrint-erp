import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IPpRepository } from '../../domain/repositories/pp.repository';

export class ApproveBomCommand {
  constructor(public bomId: number, public approvedBy: number) {}
}

@CommandHandler(ApproveBomCommand)
export class ApproveBomHandler implements ICommandHandler<ApproveBomCommand> {
  private readonly logger = new Logger(ApproveBomHandler.name);
  constructor(
    @Inject('IPpRepository') private ppRepo: IPpRepository
  ) {}

  async execute(command: ApproveBomCommand): Promise<Result<void>> {
    this.logger.log('Approving BOM');

    const bomResult = await this.ppRepo.getBom(command.bomId);
    if (!bomResult.ok) {
      return Err(bomResult.error);
    }

    const bom = bomResult.data;
    const approveResult = bom.approve(command.approvedBy);
    if (!approveResult.ok) {
      return approveResult;
    }

    // §8.2 Checkpoint 1: BOM approved
    const saveResult = await this.ppRepo.saveBom(bom);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    this.logger.log('BOM approved - Checkpoint 1 completed');
    return Ok(undefined);
  }
}
