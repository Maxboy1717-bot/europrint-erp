/**
 * @module otp-session-cleanup.cron
 * @description Scheduled cron that purges expired OTP sessions every 10 minutes.
 *
 * Why: `otp_sessions` is written to on every login attempt and on every
 * resend. Without periodic cleanup the table grows unbounded — under abuse
 * (credential stuffing + OTP probing) this turns into a slow DoS against the
 * auth path. The OTP rows are useless once `expires_at` has passed because
 * `verify-otp.service` already rejects them, so we just delete them.
 *
 * Frequency: every 10 minutes. The OTP TTL is 5 minutes, so this guarantees
 * an expired row lives for at most 15 minutes before being reaped — plenty
 * fast to keep the table bounded, slow enough that the cron itself is not a
 * load source.
 *
 * Audit reference: B.16 — OTP session lifecycle (P1).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OtpSessionRepository } from '../repositories/otp-session.repository';
import { isErr } from '@common/result';

@Injectable()
export class OtpSessionCleanupCron {
  private readonly logger = new Logger(OtpSessionCleanupCron.name);

  constructor(private readonly otpRepo: OtpSessionRepository) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run(): Promise<void> {
    try {
      const result = await this.otpRepo.deleteExpired();
      if (isErr(result)) {
        this.logger.warn(`OTP cleanup failed: ${result.error.message ?? result.error}`);
        return;
      }
      if (result.data > 0) {
        this.logger.log(`OTP cleanup: purged ${result.data} expired session(s)`);
      }
    } catch (e: unknown) {
      // Defensive: a cron must never surface an exception to the scheduler.
      this.logger.error(`OTP cleanup crashed: ${String(e)}`);
    }
  }
}
