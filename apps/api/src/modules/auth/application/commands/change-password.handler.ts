/**
 * @module change-password.handler
 * @description CQRS handler for `PATCH /auth/change-password`. Validates the
 * new password through `PasswordValueObject.create()` (complexity rules) then
 * verifies the old password via bcrypt before persisting the new hash.
 */

import { AppErr, AppError, Err, isErr, safeCall } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';
import { PasswordValueObject } from '../../domain/value-objects/password.vo';

/**
 * Inbound command shape for password change.
 * @property userId - authenticated user (from JWT, not from body)
 * @property oldPassword - current plain-text password (verified by bcrypt)
 * @property newPassword - desired plain-text password (validated by PasswordValueObject)
 */
export interface ChangePasswordCommand {
  userId: number;
  oldPassword: string;
  newPassword: string;
}
export type ChangePasswordCommandResult =
  | { ok: true; data: void }
  | { ok: false; error: AppError };
/** Password-change command handler. Stateless. */
@Injectable()
export class ChangePasswordHandler {
  private readonly logger = new Logger('ChangePasswordHandler');
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Executes the password-change use-case.
   * @param command - { userId, oldPassword, newPassword }
   * @returns Ok(undefined) on success; Err('NOT_FOUND' | 'VALIDATION') on failure
   * @throws never — all error paths return a Result
   */
  async execute(command: ChangePasswordCommand): Promise<ChangePasswordCommandResult> {
    const user = await this.authRepo.findById(command.userId);
    if (!user) {
      this.logger.warn('User not found');
      return Err(AppErr('NOT_FOUND', await this.i18n.t('errors.userNotFound')));
    }
    const voResult = await safeCall(() => PasswordValueObject.create(command.newPassword), 'VALIDATION');
    if (isErr(voResult)) {
      this.logger.warn(`Password validation failed: ${voResult.error.message}`);
      return Err(AppErr('VALIDATION', await this.i18n.t('auth.passwordTooWeak')));
    }
    const newPasswordVo = voResult.data;
    const isChanged = await user.changePassword(command.oldPassword, newPasswordVo);
    if (!isChanged) {
      this.logger.warn('Old password verification failed');
      return Err(AppErr('VALIDATION', await this.i18n.t('auth.currentPasswordIncorrect')));
    }
    await this.authRepo.save(user);
    this.logger.log('Password changed successfully');
    return { ok: true, data: undefined };
  }
}