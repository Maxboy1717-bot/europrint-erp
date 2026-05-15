/**
 * @module verify-otp.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Ok, Err, AppErr, Result, isErr } from '@common/result';
import { OtpSessionRepository } from '../../infrastructure/repositories/otp-session.repository';

export interface VerifyOtpCommand {
  code: string;
  sessionId: string;
}

@Injectable()
export class VerifyOtpHandler {
  constructor(
    private readonly otpRepo: OtpSessionRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<Result<{ success: boolean; message: string }>> {
    const sessionResult = await this.otpRepo.findBySessionId(command.sessionId);
    if (isErr(sessionResult)) return Err(sessionResult.error);
    if (!sessionResult.data) {
      return Err(AppErr('NOT_FOUND', await this.i18n.t('auth.otpSessionNotFound')));
    }
    const session = sessionResult.data;
    if (session.expiresAt < _time.now()) {
      return Err(AppErr('BAD_REQUEST', await this.i18n.t('auth.otpExpired')));
    }
    if (session.code !== command.code) {
      return Err(AppErr('BAD_REQUEST', await this.i18n.t('auth.otpInvalid')));
    }
    const invalidateResult = await this.otpRepo.markUsed(session.id);
    if (isErr(invalidateResult)) return Err(invalidateResult.error);
    return Ok({ success: true, message: await this.i18n.t('auth.otpVerified') });
  }
}
