import { AppErr, AppError, Err, isErr, safeCall } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';
import { PasswordValueObject } from '../../domain/value-objects/password.vo';
export interface ChangePasswordCommand {
  userId: number;
  oldPassword: string;
  newPassword: string;
}
export type ChangePasswordCommandResult =
  | { ok: true; data: void }
  | { ok: false; error: AppError };
@Injectable()
export class ChangePasswordHandler {
  private readonly logger = new Logger('ChangePasswordHandler');
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
  ) {}
  async execute(command: ChangePasswordCommand): Promise<ChangePasswordCommandResult> {
    const user = await this.authRepo.findById(command.userId);
    if (!user) {
      this.logger.warn('User not found');
      return Err(AppErr('NOT_FOUND', 'User not found'));
    }
    const voResult = await safeCall(() => PasswordValueObject.create(command.newPassword), 'VALIDATION');
    if (isErr(voResult)) {
      this.logger.warn(`Password validation failed: ${voResult.error.message}`);
      return Err(AppErr('VALIDATION', 'Password complexity requirements not met'));
    }
    const newPasswordVo = voResult.data;
    const isChanged = await user.changePassword(command.oldPassword, newPasswordVo);
    if (!isChanged) {
      this.logger.warn('Old password verification failed');
      return Err(AppErr('VALIDATION', 'Old password is incorrect'));
    }
    await this.authRepo.save(user);
    this.logger.log('Password changed successfully');
    return { ok: true, data: undefined };
  }
}