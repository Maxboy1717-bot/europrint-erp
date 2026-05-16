/**
 * @module resend-otp.service
 * @description Application service (formerly resend-otp.handler). Never implemented
 *   `ICommandHandler<T>` and never registered with the CQRS bus — the controller
 *   injects it directly. Renamed handler→service so the location matches its real
 *   role (audit P0-7).
 */

import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Ok, Err, Result, isErr } from '@common/result';
import { OtpSessionRepository } from '../../infrastructure/repositories/otp-session.repository';
import { randomInt } from 'crypto';

import { OTP_MIN, OTP_MAX_EXCLUSIVE, MS_PER_MINUTE } from '@common/constants/app.constants';
export interface ResendOtpCommand {
  ipAddress: string;
}

function generateOtp(): string {
  return String(randomInt(OTP_MIN, OTP_MAX_EXCLUSIVE));
}

@Injectable()
export class ResendOtpService {
  constructor(
    private readonly otpRepo: OtpSessionRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(command: ResendOtpCommand): Promise<Result<{ success: boolean; message: string; sessionId: string; expiresIn: number }>> {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 3 * MS_PER_MINUTE);
    const invalidateResult = await this.otpRepo.invalidatePending(command.ipAddress);
    if (isErr(invalidateResult)) return Err(invalidateResult.error);
    const insertResult = await this.otpRepo.insert(command.ipAddress, code, expiresAt);
    if (isErr(insertResult)) return Err(insertResult.error);
    return Ok({ success: true, message: await this.i18n.t('auth.otpResent'), sessionId: insertResult.data, expiresIn: 180 });
  }
}
