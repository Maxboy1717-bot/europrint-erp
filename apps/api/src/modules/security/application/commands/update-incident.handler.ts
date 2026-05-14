/**
 * @module update-incident.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { UpdateIncidentCommand } from './update-incident.command';
import { SecurityIncident } from '../../domain/aggregates/security-incident.aggregate';
import { IIncidentRepo, INCIDENT_REPO } from '../../domain/repositories/i-incident.repo';

@Injectable()
@CommandHandler(UpdateIncidentCommand)
export class UpdateIncidentHandler implements ICommandHandler<UpdateIncidentCommand> {
  private readonly logger = new Logger(UpdateIncidentHandler.name);

  constructor(
    @Inject(INCIDENT_REPO) private readonly incidentRepo: IIncidentRepo,
      ) {}

  async execute(command: UpdateIncidentCommand): Promise<Result<SecurityIncident>> {
    const findResult = await this.incidentRepo.findById(command.incidentId);

    if (!findResult.ok) {
      this.logger.error('Failed to find incident');
      return findResult as Result<SecurityIncident>;
    }

    if (!findResult.data) {
      return Err(AppErr('NOT_FOUND', 'Incident not found'));
    }

    const incident = findResult.data;

    if (command.assignedTo) {
      incident.assign(command.assignedTo);
    }

    if (command.status) {
      incident.updateStatus(command.status);
    }

    if (command.resolutionNotes) {
      incident.resolutionNotes = command.resolutionNotes;
    }

    const updateResult = await this.incidentRepo.update(incident.id, {
      assignedTo: incident.assignedTo,
      status: incident.status,
      resolutionNotes: incident.resolutionNotes,
    });

    if (!updateResult.ok) {
      this.logger.error('Failed to update incident');
      return updateResult;
    }

    this.logger.log(
      { incidentId: incident.id, assignedTo: command.assignedTo, status: command.status },
      'Incident updated',
    );

    return updateResult;
  }
}
