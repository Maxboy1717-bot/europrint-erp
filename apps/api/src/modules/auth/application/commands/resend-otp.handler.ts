/**
 * @module resend-otp.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
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
export class ResendOtpHandler {
  constructor(private readonly otpRepo: OtpSessionRepository) {}

  async execute(command: ResendOtpCommand): Promise<Result<{ success: boolean; message: string; sessionId: string; expiresIn: number }>> {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 3 * MS_PER_MINUTE);
    const invalidateResult = await this.otpRepo.invalidatePending(command.ipAddress);
    if (isErr(invalidateResult)) return Err(invalidateResult.error);
    const insertResult = await this.otpRepo.insert(command.ipAddress, code, expiresAt);
    if (isErr(insertResult)) return Err(insertResult.error);
    return Ok({ success: true, message: 'Yangi OTP kodi yaratildi', sessionId: insertResult.data, expiresIn: 180 });
  }
}
