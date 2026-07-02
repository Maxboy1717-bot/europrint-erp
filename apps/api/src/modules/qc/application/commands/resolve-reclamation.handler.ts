/**
 * @module resolve-reclamation.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 *   Replaces the raw-SQL `PATCH qc/reclamations/:id` that lived in
 *   qc-defects-extended.repository.ts — that query wrote a `root_cause_id`
 *   column that does not exist on qc_reclamations (100% crash on every call).
 *   Mirrors the ResolveDefectCommand CQRS pattern (find → mutate aggregate →
 *   persist via repository).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ResolveReclamationCommand } from './resolve-reclamation.command';
import { Reclamation, ReclamationStatus } from '../../domain/aggregates/reclamation.aggregate';
import { IQcDefectRepository, QC_DEFECT_REPO } from '../../infrastructure/repositories/drizzle-defect.repo';

const RECLAMATION_STATUSES: readonly string[] = Object.values(ReclamationStatus);

@Injectable()
@CommandHandler(ResolveReclamationCommand)
export class ResolveReclamationHandler implements ICommandHandler<ResolveReclamationCommand> {
  private readonly logger = new Logger(ResolveReclamationHandler.name);

  constructor(
    @Inject(QC_DEFECT_REPO) private readonly qcRepository: IQcDefectRepository,
  ) {}

  async execute(command: ResolveReclamationCommand): Promise<Result<Reclamation>> {
    const found = await this.qcRepository.findReclamationById(command.reclamationId);

    if (!found.ok || !found.data) {
      this.logger.error('Reclamation not found');
      return Err(AppErr('NOT_FOUND', 'Reclamation not found'));
    }

    const reclamation = found.data;

    if (command.status) {
      if (!RECLAMATION_STATUSES.includes(command.status)) {
        return Err(AppErr('VALIDATION', `Invalid reclamation status: ${command.status}`));
      }
      reclamation.status = command.status as ReclamationStatus;
      if (reclamation.status === ReclamationStatus.RESOLVED) {
        reclamation.resolvedAt = _time.now();
      }
    }
    if (command.resolution != null) {
      reclamation.resolution = command.resolution;
    }
    reclamation.updatedAt = _time.now();

    const updateResult = await this.qcRepository.updateReclamation(reclamation);

    if (!updateResult.ok) {
      this.logger.error('Failed to update reclamation');
      return Err(updateResult.error);
    }

    this.logger.log('Reclamation updated');
    return Ok(reclamation);
  }
}
