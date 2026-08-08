/**
 * @module set-fault-attribution.handler
 * @description CQRS command handler. execute() sets qc_defects.is_customer_fault
 * (owner decision 2026-07-13, chat: "QC defect marked customer fault -> auto-notify
 * sales manager"). When set TRUE, publishes QcDefectCustomerFaultEvent — the SD-side
 * listener (qc-customer-fault-sd.listener.ts) resolves the sales manager and sends the
 * notification; this handler stays QC-only (module boundary — modules talk via events,
 * same shape as ReportDefectHandler/SubmitInspectionHandler publishing QcFailedEvent).
 * Returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Err, Ok, Result } from '@common/result';
import { SetFaultAttributionCommand } from './set-fault-attribution.command';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';
import { QcDefectCustomerFaultEvent } from '../../domain/events';

@Injectable()
@CommandHandler(SetFaultAttributionCommand)
export class SetFaultAttributionHandler implements ICommandHandler<SetFaultAttributionCommand> {
  private readonly logger = new Logger(SetFaultAttributionHandler.name);

  constructor(
    @Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: SetFaultAttributionCommand,
  ): Promise<Result<{ id: number; isCustomerFault: boolean }>> {
    const result = await this.qcRepository.setFaultAttribution(command.defectId, command.isCustomerFault);
    if (!result.ok) {
      this.logger.warn('Failed to set defect fault attribution');
      return Err(result.error);
    }

    if (command.isCustomerFault) {
      this.eventBus.publish(
        new QcDefectCustomerFaultEvent(
          command.defectId,
          result.data.inspectionId,
          result.data.defectCode,
          command.userId,
        ),
      );
      this.logger.log('Defect marked customer-fault — QcDefectCustomerFaultEvent published');
    }

    return Ok({ id: result.data.id, isCustomerFault: result.data.isCustomerFault });
  }
}
