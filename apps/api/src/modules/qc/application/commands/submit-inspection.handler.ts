/**
 * @module submit-inspection.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { SubmitInspectionCommand } from './submit-inspection.command';
import { QcPassedEvent, QcFailedEvent, SupplierQualityFailEvent } from '../../domain/events';
import { IQcRepository, QC_REPOSITORY_PROVIDER } from '../repositories/qc.repository';

@Injectable()
@CommandHandler(SubmitInspectionCommand)
export class SubmitInspectionHandler implements ICommandHandler<SubmitInspectionCommand> {
  private readonly logger = new Logger(SubmitInspectionHandler.name);

  constructor(
    @Inject(QC_REPOSITORY_PROVIDER) private readonly qcRepository: IQcRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SubmitInspectionCommand): Promise<Result<string>> {
    // Inspection read + state transition + save atomically — partial failures roll back.
    const outcome = await this.qcRepository.withTransaction(async (tx) => {
      const inspection = await this.qcRepository.findById(command.inspectionId, tx);
      if (!inspection) {
        return Err(AppErr('NOT_FOUND', 'Inspection not found'));
      }

      if (command.passed) {
        inspection.pass();
      } else {
        inspection.fail(command.reason);
      }

      await this.qcRepository.save(inspection, tx);
      return Ok(inspection.id);
    });

    if (!outcome.ok) {
      return Err(outcome.error);
    }
    const inspectionId = outcome.data;
    if (!inspectionId) {
      return Err(AppErr('INTERNAL', 'Inspection transaction returned no id'));
    }

    // Publish events only after the tx committed.
    if (command.passed) {
      this.eventBus.publish(new QcPassedEvent(inspectionId, command.orderId));
      this.logger.log('QC passed - Trigger 11');
    } else {
      this.eventBus.publish(new QcFailedEvent(inspectionId, command.orderId, command.reason));

      if (command.supplierId) {
        this.eventBus.publish(
          new SupplierQualityFailEvent(command.supplierId, command.orderId, command.reason),
        );
        this.logger.log(
          { supplierId: command.supplierId, orderId: command.orderId },
          'Supplier quality fail - Trigger 19',
        );
      }
    }

    return Ok(inspectionId);
  }
}
