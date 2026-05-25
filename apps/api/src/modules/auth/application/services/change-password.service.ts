/**
 * @module change-password.service
 * @description Application service (formerly change-password.handler) for
 *   `PATCH /auth/change-password`. Validates the new password's complexity
 *   via `PasswordValueObject.validateComplexity()`, hashes it through the
 *   injected `IPasswordHasher` port, then verifies the old password (also
 *   via the port) before persisting the new hash.
 *
 *   Never implemented `ICommandHandler<T>` and never registered with the CQRS
 *   bus — the controller injects it directly. Renamed handler→service so the
 *   location matches its real role (audit P0-7).
 */

import { AppErr, AppError, Err, isErr, safeCall } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';
import { PasswordValueObject } from '../../domain/value-objects/password.vo';
import { IPasswordHasher, PASSWORD_HASHER } from '../../domain/ports/i-password-hasher.port';

/**
 * Inbound command shape for password change.
 * @property userId - authenticated user (from JWT, not from body)
 * @property oldPassword - current plain-text password (verified via IPasswordHasher)
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
/** Password-change application service. Stateless. */
@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger('ChangePasswordService');
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
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
    const voResult = await safeCall(async () => {
      PasswordValueObject.validateComplexity(command.newPassword);
      const newHash = await this.passwordHasher.hash(command.newPassword);
      return PasswordValueObject.fromHash(newHash);
    }, 'VALIDATION');
    if (isErr(voResult)) {
      this.logger.warn(`Password validation failed: ${voResult.error.message}`);
      return Err(AppErr('VALIDATION', await this.i18n.t('auth.passwordTooWeak')));
    }
    const newPasswordVo = voResult.data;
    const isChanged = await user.changePassword(command.oldPassword, newPasswordVo, this.passwordHasher);
    if (!isChanged) {
      this.logger.warn('Old password verification failed');
      return Err(AppErr('VALIDATION', await this.i18n.t('auth.currentPasswordIncorrect')));
    }
    await this.authRepo.save(user);
    this.logger.log('Password changed successfully');
    return { ok: true, data: undefined };
  }
}
