/**
 * @module create-reclamation.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { CreateReclamationCommand } from './create-reclamation.command';
import { Reclamation, ReclamationStatus } from '../../domain/aggregates/reclamation.aggregate';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';

@Injectable()
@CommandHandler(CreateReclamationCommand)
export class CreateReclamationHandler implements ICommandHandler<CreateReclamationCommand> {
  private readonly logger = new Logger(CreateReclamationHandler.name);

  constructor(
    @Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
      ) {}

  async execute(command: CreateReclamationCommand): Promise<Result<Reclamation>> {
      const reclamation = new Reclamation(
        this.generateId(),
        command.customerName,
        command.customerId,
        command.orderId,
        command.description,
        command.severity,
        ReclamationStatus.OPEN,
        _time.now(),
        null,
        null,
        null,
        _time.now(),
        _time.now(),
      );

      const saveResult = await this.qcRepository.saveReclamation(reclamation);

      if (!saveResult.ok) {
        this.logger.error('Failed to save reclamation');
        return saveResult;
      }

      this.logger.log('Reclamation created');
      return Ok(reclamation);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
