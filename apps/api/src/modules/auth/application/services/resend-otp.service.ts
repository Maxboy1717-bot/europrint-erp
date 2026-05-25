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

// OTP code is valid for 5 minutes after issue — long enough for SMS / email
// delivery, short enough that an intercepted code becomes useless quickly.
// Audit B.16 raised this from 3 → 5 minutes to match the verification window.
const OTP_TTL_MINUTES = 5;
const OTP_TTL_SECONDS = OTP_TTL_MINUTES * 60;

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
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * MS_PER_MINUTE);
    const invalidateResult = await this.otpRepo.invalidatePending(command.ipAddress);
    if (isErr(invalidateResult)) return Err(invalidateResult.error);
    const insertResult = await this.otpRepo.insert(command.ipAddress, code, expiresAt);
    if (isErr(insertResult)) return Err(insertResult.error);
    return Ok({ success: true, message: await this.i18n.t('auth.otpResent'), sessionId: insertResult.data, expiresIn: OTP_TTL_SECONDS });
  }
}
