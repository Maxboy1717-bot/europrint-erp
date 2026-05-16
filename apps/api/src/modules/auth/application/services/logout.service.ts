/**
 * @module logout.service
 * @description Application service (formerly logout.handler). Never implemented
 *   `ICommandHandler<T>` and never registered with the CQRS bus — the controller
 *   injects it directly. Renamed handler→service so the location matches its real
 *   role (audit P0-7).
 */

import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';

import { MS_PER_SECOND } from '@common/constants/app.constants';
export interface LogoutCommand {
  token: string;
  userId: number;
}

export type LogoutCommandResult =
  | { ok: true; data: void }
  | { ok: false; error: AppError };

@Injectable()
export class LogoutService {
  private readonly logger = new Logger('LogoutService');
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutCommandResult> {
      const decoded = this.jwtService.decode(command.token);

      if (!decoded || typeof decoded === 'string') {
        this.logger.warn('Invalid token format: ' + command.userId);
        return Err(AppErr('VALIDATION', await this.i18n.t('errors.tokenInvalid')));
      }

      if (!decoded.exp) {
        return Err(AppErr('VALIDATION', await this.i18n.t('errors.tokenInvalid')));
      }

      const expiresAt = new Date(decoded.exp * MS_PER_SECOND);
      await this.authRepo.blacklistToken(command.token, expiresAt);

      this.logger.log('User logged out: ' + command.userId);

      return { ok: true, data: undefined };
  }
}
