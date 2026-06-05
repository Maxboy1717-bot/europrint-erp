/**
 * @module report-incident.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { ReportIncidentCommand } from './report-incident.command';
import { SecurityIncidentDetectedEvent } from '../../domain/events';
import { SecurityIncident } from '../../domain/aggregates/security-incident.aggregate';
import { IIncidentRepo, INCIDENT_REPO } from '../../domain/repositories/i-incident.repo';

@Injectable()
@CommandHandler(ReportIncidentCommand)
export class ReportIncidentHandler implements ICommandHandler<ReportIncidentCommand> {
  private readonly logger = new Logger(ReportIncidentHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(INCIDENT_REPO) private readonly incidentRepo: IIncidentRepo,
  ) {}

  async execute(command: ReportIncidentCommand): Promise<Result<string>> {
      const incident = SecurityIncident.create(
        command.type as never,
        command.severity as never,
        command.title,
        command.description,
        command.reportedBy,
      );

      // Leverage #6: was a FAKE-CREATE — no repo was injected, so the incident was never persisted
      // (returned an in-memory id). Now save to security_incidents and use the persisted aggregate.
      const saveResult = await this.incidentRepo.save(incident);
      if (!saveResult.ok) {
        this.logger.error('Failed to persist security incident');
        return saveResult as unknown as Result<string>;
      }
      const saved = saveResult.data;

      this.eventBus.publish(
        new SecurityIncidentDetectedEvent(saved.id, saved.type, saved.severity),
      );

      this.logger.warn(
        { incidentId: saved.id, type: saved.type, severity: saved.severity },
        'Security incident reported and persisted',
      );
      return Ok(saved.id);
  }
}
