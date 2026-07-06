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
      // id=0 is a placeholder — the repository assigns the real serial id
      // (qc_reclamations_id_seq) and returns the persisted entity below.
      const reclamation = new Reclamation(
        0,
        command.customerName,
        command.customerId,
        command.orderId,
        command.description,
        command.severity,
        ReclamationStatus.NEW,
        _time.now(),
        null,
        null,
        null,
        _time.now(),
        _time.now(),
        command.createdBy,
      );

      const saveResult = await this.qcRepository.saveReclamation(reclamation);

      if (!saveResult.ok) {
        this.logger.error('Failed to save reclamation');
        return saveResult;
      }

      this.logger.log('Reclamation created');
      return Ok(saveResult.data);
  }
}
