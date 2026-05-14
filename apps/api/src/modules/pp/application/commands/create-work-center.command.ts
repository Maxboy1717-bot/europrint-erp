/**
 * @module create-work-center.command
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Result, Err } from '@common/result';
import { WorkCenter, WorkCenterType } from '../../domain/aggregates/work-center.aggregate';
import { DrizzleWorkCenterRepository } from '../../infrastructure/repositories/drizzle-work-center.repo';

export class CreateWorkCenterCommand {
  constructor(public readonly code: string,
    public readonly name: string,
    public readonly type: WorkCenterType,
    public readonly capacity: number,
    public readonly costPerHour: number,
    public readonly certificationLmsCourseId?: string | null,
    public readonly department?: string | null) {}
}

@Injectable()
@CommandHandler(CreateWorkCenterCommand)
export class CreateWorkCenterHandler implements ICommandHandler<CreateWorkCenterCommand> {
  private readonly logger = new Logger(CreateWorkCenterHandler.name);

  constructor(
    @Inject('IWorkCenterRepository')
    private readonly workCenterRepo: DrizzleWorkCenterRepository,
  ) {}

  async execute(command: CreateWorkCenterCommand): Promise<Result<WorkCenter>> {
    try {
      const codeCheckResult = await this.workCenterRepo.checkCodeUnique(command.code);
      if (!codeCheckResult.ok) {
        this.logger.warn(`Code already exists: ${command.code}`);
        return Err(codeCheckResult.error);
      }

      const now = _time.now();
      const workCenter = new WorkCenter(
        createId(),
        command.code,
        command.name,
        command.type,
        command.capacity,
        command.costPerHour,
        command.certificationLmsCourseId || null,
        command.department || null,
        true,
        now,
        now,
      );

      const saveResult = await this.workCenterRepo.save(workCenter);
      if (!saveResult.ok) {
        this.logger.error(`Failed to save work center: ${saveResult.error}`);
        return Err(saveResult.error);
      }

      this.logger.log(`Work center created: ${saveResult.data?.id}`);
      return { ok: true, data: saveResult.data };
    } catch (error: unknown) {
      this.logger.error(`Error creating work center: ${(error as Error).message}`);
      return Err('Work center yaratishda xatolik');
    }
  }
}
