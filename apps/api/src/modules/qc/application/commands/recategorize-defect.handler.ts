/**
 * @module recategorize-defect.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Err, Ok, Result } from '@common/result';
import { RecategorizeDefectCommand } from './recategorize-defect.command';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';

@Injectable()
@CommandHandler(RecategorizeDefectCommand)
export class RecategorizeDefectHandler implements ICommandHandler<RecategorizeDefectCommand> {
  private readonly logger = new Logger(RecategorizeDefectHandler.name);

  constructor(
    @Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
  ) {}

  async execute(command: RecategorizeDefectCommand): Promise<Result<{ id: number; defectType: string }>> {
    const result = await this.qcRepository.recategorizeDefect(command.defectId, command.defectType);
    if (!result.ok) {
      this.logger.warn('Failed to recategorize defect');
      return Err(result.error);
    }
    this.logger.log('Defect recategorized by technologist');
    return Ok(result.data);
  }
}
