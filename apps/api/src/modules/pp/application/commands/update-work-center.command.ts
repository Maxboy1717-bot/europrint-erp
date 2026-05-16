/**
 * @module update-work-center.command
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err } from '@common/result';
import { WorkCenter, WorkCenterType } from '../../domain/aggregates/work-center.aggregate';
import { DrizzleWorkCenterRepository } from '../../infrastructure/repositories/drizzle-work-center.repo';
import { WORK_CENTER_REPO } from '../../domain/repositories/pp.repository';

export class UpdateWorkCenterCommand {
  constructor(public readonly id: string,
    public readonly code?: string,
    public readonly name?: string,
    public readonly type?: WorkCenterType,
    public readonly capacity?: number,
    public readonly costPerHour?: number,
    public readonly certificationLmsCourseId?: string | null,
    public readonly department?: string | null) {}
}

@Injectable()
@CommandHandler(UpdateWorkCenterCommand)
export class UpdateWorkCenterHandler implements ICommandHandler<UpdateWorkCenterCommand> {
  private readonly logger = new Logger(UpdateWorkCenterHandler.name);

  constructor(
    @Inject(WORK_CENTER_REPO)
    private readonly workCenterRepo: DrizzleWorkCenterRepository,
  ) {}

  async execute(command: UpdateWorkCenterCommand): Promise<Result<WorkCenter>> {
    try {
      const existingResult = await this.workCenterRepo.findById(command.id);
      if (!existingResult.ok) {
        this.logger.warn(`Work center not found: ${command.id}`);
        return Err(existingResult.error);
      }

      const existing = existingResult.data;

      if (command.code && command.code !== existing.code) {
        const codeCheckResult = await this.workCenterRepo.checkCodeUnique(
          command.code,
          command.id,
        );
        if (!codeCheckResult.ok) {
          this.logger.warn(`Code already exists: ${command.code}`);
          return Err(codeCheckResult.error);
        }
      }

      const updated = new WorkCenter(
        existing.id,
        command.code || existing.code,
        command.name || existing.name,
        command.type || existing.type,
        command.capacity !== undefined ? command.capacity : existing.capacity,
        command.costPerHour !== undefined ? command.costPerHour : existing.costPerHour,
        command.certificationLmsCourseId !== undefined
          ? command.certificationLmsCourseId
          : existing.certificationLmsCourseId,
        command.department !== undefined ? command.department : existing.department,
        existing.isActive,
        existing.createdAt,
        _time.now(),
      );

      const updateResult = await this.workCenterRepo.update(updated);
      if (!updateResult.ok) {
        this.logger.error(`Failed to update work center: ${updateResult.error}`);
        return Err(updateResult.error);
      }

      this.logger.log(`Work center updated: ${command.id}`);
      return { ok: true, data: updateResult.data };
    } catch (error: unknown) {
      this.logger.error(`Error updating work center: ${(error as Error).message}`);
      return Err('Work center yangilashda xatolik');
    }
  }
}
