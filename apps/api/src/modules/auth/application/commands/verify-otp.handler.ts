/**
 * @module verify-otp.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, AppErr, Result, isErr } from '@common/result';
import { OtpSessionRepository } from '../../infrastructure/repositories/otp-session.repository';

export interface VerifyOtpCommand {
  code: string;
  sessionId: string;
}

@Injectable()
export class VerifyOtpHandler {
  constructor(private readonly otpRepo: OtpSessionRepository) {}

  async execute(command: VerifyOtpCommand): Promise<Result<{ success: boolean; message: string }>> {
    const sessionResult = await this.otpRepo.findBySessionId(command.sessionId);
    if (isErr(sessionResult)) return Err(sessionResult.error);
    if (!sessionResult.data) {
      return Err(AppErr('NOT_FOUND', "Faol OTP sessiyasi topilmadi. Qayta yuborish tugmasini bosing"));
    }
    const session = sessionResult.data;
    if (session.expiresAt < _time.now()) {
      return Err(AppErr('BAD_REQUEST', "OTP muddati o'tgan. Yangi kod so'rang"));
    }
    if (session.code !== command.code) {
      return Err(AppErr('BAD_REQUEST', "Noto'g'ri OTP kodi. Qaytadan urinib ko'ring"));
    }
    const invalidateResult = await this.otpRepo.markUsed(session.id);
    if (isErr(invalidateResult)) return Err(invalidateResult.error);
    return Ok({ success: true, message: 'OTP muvaffaqiyatli tasdiqlandi' });
  }
}
