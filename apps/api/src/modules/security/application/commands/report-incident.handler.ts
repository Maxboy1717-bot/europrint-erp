/**
 * @module report-incident.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { ReportIncidentCommand } from './report-incident.command';
import { SecurityIncidentDetectedEvent } from '../../domain/events';
import { SecurityIncident } from '../../domain/aggregates/security-incident.aggregate';

@Injectable()
@CommandHandler(ReportIncidentCommand)
export class ReportIncidentHandler implements ICommandHandler<ReportIncidentCommand> {
  private readonly logger = new Logger(ReportIncidentHandler.name);

  constructor(
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: ReportIncidentCommand): Promise<Result<string>> {
      const incident = SecurityIncident.create(
        command.type as never,
        command.severity as never,
        command.title,
        command.description,
        command.reportedBy,
      );

      this.eventBus.publish(
        new SecurityIncidentDetectedEvent(incident.id, incident.type, incident.severity),
      );

      this.logger.warn(
        { incidentId: incident.id, type: incident.type, severity: incident.severity },
        'Security incident reported',
      );
      return Ok(incident.id);
  }
}
