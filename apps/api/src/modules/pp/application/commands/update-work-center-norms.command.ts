/**
 * @module update-work-center-norms.command
 * @description Wave 4 (500K build): work_center per-sex norma/brak/crew config command + handler.
 *              Qiymatlar egasi-DATA — bu faqat yozish-yo'li (struktura), Q-40.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result, Err, Ok } from '@common/result';
import { DrizzleWorkCenterRepository } from '../../infrastructure/repositories/drizzle-work-center.repo';
import { WORK_CENTER_REPO } from '../../domain/repositories/pp.repository';

export interface WorkCenterNormsPatch {
  normaM2PerShift?: number;
  normaKgPerShift?: number;
  brakLimitPct?: number;
  minCrewSize?: number;
  maxCrewSize?: number;
}

export class UpdateWorkCenterNormsCommand {
  constructor(
    public readonly id: string,
    public readonly norms: WorkCenterNormsPatch,
  ) {}
}

@Injectable()
@CommandHandler(UpdateWorkCenterNormsCommand)
export class UpdateWorkCenterNormsHandler implements ICommandHandler<UpdateWorkCenterNormsCommand> {
  private readonly logger = new Logger(UpdateWorkCenterNormsHandler.name);

  constructor(
    @Inject(WORK_CENTER_REPO)
    private readonly workCenterRepo: DrizzleWorkCenterRepository,
  ) {}

  async execute(command: UpdateWorkCenterNormsCommand): Promise<Result<Record<string, unknown>>> {
    try {
      const existing = await this.workCenterRepo.findById(command.id);
      if (!existing.ok) {
        this.logger.warn(`Work center not found: ${command.id}`);
        return Err(existing.error);
      }
      const res = await this.workCenterRepo.updateNorms(command.id, command.norms);
      if (!res.ok) {
        this.logger.error(`Failed to update work center norms: ${res.error}`);
        return Err(res.error);
      }
      this.logger.log(`Work center norms updated: ${command.id}`);
      return Ok(res.data);
    } catch (error: unknown) {
      this.logger.error(`Error updating work center norms: ${(error as Error).message}`);
      return Err('Work center norma yangilashda xatolik');
    }
  }
}
