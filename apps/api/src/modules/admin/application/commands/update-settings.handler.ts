/**
 * @module update-settings.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ISettingsRepo } from '../../domain/repositories/i-settings.repo';
import { SETTINGS_REPO } from '../../admin.tokens';
import { UserRole } from '../../domain/aggregates/user.aggregate';

export interface UpdateSettingsCommand {
  advancePercent?: number;
  freeStorageDays?: number;
  storageDailyRate?: number;
  updatedBy: number;
  userRole: UserRole;
}

export type UpdateSettingsCommandResult =
  | { ok: true; data: void }
  | { ok: false; error: AppError };

@Injectable()
export class UpdateSettingsHandler {
  private readonly logger = new Logger(UpdateSettingsHandler.name);

  constructor(
    @Inject(SETTINGS_REPO) private readonly settingsRepo: ISettingsRepo,
  ) {}

  async execute(command: UpdateSettingsCommand): Promise<UpdateSettingsCommandResult> {
      if (command.userRole !== UserRole.SUPER_ADMIN) {
        this.logger.warn('Insufficient permissions: ' + command.updatedBy);
        return Err(AppErr('FORBIDDEN', 'Insufficient permissions'));
      }

      const settings = await this.settingsRepo.getSettings();
      if (!settings) {
        this.logger.warn('System settings not found');
        return Err(AppErr('NOT_FOUND', 'System settings not found'));
      }

      if (command.advancePercent !== undefined) {
        settings.setAdvancePercent(command.advancePercent);
      }

      if (command.freeStorageDays !== undefined) {
        settings.setFreeStorageDays(command.freeStorageDays);
      }

      if (command.storageDailyRate !== undefined) {
        settings.setStorageDailyRate(command.storageDailyRate);
      }

      await this.settingsRepo.save(settings);

      this.logger.log('System settings updated by: ' + command.updatedBy);

      return { ok: true, data: undefined };
  }
}
