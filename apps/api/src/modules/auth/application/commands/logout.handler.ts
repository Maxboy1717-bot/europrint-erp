/**
 * @module logout.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { AppErr, AppError, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
export class LogoutHandler {
  private readonly logger = new Logger('LogoutHandler');
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutCommandResult> {
      const decoded = this.jwtService.decode(command.token);

      if (!decoded || typeof decoded === 'string') {
        this.logger.warn('Invalid token format: ' + command.userId);
        return Err(AppErr('VALIDATION', 'Invalid token'));
      }

      if (!decoded.exp) {
        return Err('Token has no expiration');
      }

      const expiresAt = new Date(decoded.exp * MS_PER_SECOND);
      await this.authRepo.blacklistToken(command.token, expiresAt);

      this.logger.log('User logged out: ' + command.userId);

      return { ok: true, data: undefined };
  }
}
