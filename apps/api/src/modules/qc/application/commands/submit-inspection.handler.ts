import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { SubmitInspectionCommand } from './submit-inspection.command';
import { QcPassedEvent, QcFailedEvent, SupplierQualityFailEvent } from '../../domain/events';
import { IQcRepository } from '../repositories/qc.repository';

@Injectable()
@CommandHandler(SubmitInspectionCommand)
export class SubmitInspectionHandler implements ICommandHandler<SubmitInspectionCommand> {
  private readonly logger = new Logger(SubmitInspectionHandler.name);

  constructor(
    @Inject('IQcRepository') private readonly qcRepository: IQcRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SubmitInspectionCommand): Promise<Result<string>> {
    const inspection = await this.qcRepository.findById(command.inspectionId);
    if (!inspection) {
      return Err(AppErr('NOT_FOUND', 'Inspection not found'));
    }

    if (command.passed) {
      inspection.pass();
      this.eventBus.publish(new QcPassedEvent(inspection.id, command.orderId));
      this.logger.log('QC passed - Trigger 11');
    } else {
      inspection.fail(command.reason);
      this.eventBus.publish(new QcFailedEvent(inspection.id, command.orderId, command.reason));

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

    await this.qcRepository.save(inspection);
    return Ok(inspection.id);
  }
}
