/**
 * @module resolve-incident.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { SecurityIncident } from '../../domain/aggregates/security-incident.aggregate';
import { IIncidentRepo, INCIDENT_REPO } from '../../domain/repositories/i-incident.repo';

export class ResolveIncidentCommand {

  constructor(readonly incidentId: string,
    readonly resolutionNotes: string) {}
}

@Injectable()
@CommandHandler(ResolveIncidentCommand)
export class ResolveIncidentHandler implements ICommandHandler<ResolveIncidentCommand> {
  private readonly logger = new Logger(ResolveIncidentHandler.name);
  constructor(
    @Inject(INCIDENT_REPO) private readonly incidentRepo: IIncidentRepo,
      ) {}

  async execute(command: ResolveIncidentCommand): Promise<Result<SecurityIncident>> {
    if (!command.resolutionNotes || command.resolutionNotes.length < 20) {
      return Err(AppErr('VALIDATION', 'Resolution notes must be at least 20 characters'));
    }

    const findResult = await this.incidentRepo.findById(command.incidentId);

    if (!findResult.ok) {
      this.logger.error('Failed to find incident');
      return findResult as Result<SecurityIncident>;
    }

    if (!findResult.data) {
      return Err(AppErr('NOT_FOUND', 'Incident not found'));
    }

    const incident = findResult.data;
    incident.closeIncident(command.resolutionNotes);

    const updateResult = await this.incidentRepo.update(incident.id, {
      status: incident.status,
      resolutionNotes: incident.resolutionNotes,
      resolvedAt: incident.resolvedAt,
    });

    if (!updateResult.ok) {
      this.logger.error('Failed to resolve incident');
      return updateResult as Result<SecurityIncident>;
    }

    this.logger.log(
      { incidentId: incident.id, status: incident.status },
      'Incident resolved - notification sent to reporter',
    );

    return updateResult;
  }
}
