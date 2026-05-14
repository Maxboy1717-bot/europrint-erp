/**
 * @module report-defect.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { ReportDefectCommand } from './report-defect.command';
import { Defect, DefectStatus } from '../../domain/aggregates/defect.aggregate';
import { IQcDefectRepository } from '../../infrastructure/repositories/drizzle-defect.repo';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

@Injectable()
@CommandHandler(ReportDefectCommand)
export class ReportDefectHandler implements ICommandHandler<ReportDefectCommand> {
  private readonly logger = new Logger(ReportDefectHandler.name);

  constructor(
    @Inject('IQcDefectRepository') private readonly qcRepository: IQcDefectRepository,
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: ReportDefectCommand): Promise<Result<Defect>> {
      const defect = new Defect(
        this.generateId(),
        command.inspectionId,
        command.productionOrderId,
        command.workCenterId,
        command.defectCode,
        command.description,
        command.severity,
        DefectStatus.OPEN,
        command.quantity,
        command.unit,
        command.reportedBy,
        null,
        null,
        null,
        _time.now(),
        _time.now(),
      );

      const saveResult = await this.qcRepository.saveDefect(defect);

      if (!saveResult.ok) {
        this.logger.error('Failed to save defect');
        return saveResult;
      }

      if (command.severity === 'critical') {
        this.eventBus.publish({
          eventType: ERP_EVENTS.QC_FAILED,
          defectId: defect.id,
          severity: command.severity,
          timestamp: _time.now(),
        });
        this.logger.log('Critical defect reported');
      }

      return Ok(defect);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
