/**
 * @module otp-session.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { otp_sessions } from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';

export interface OtpSessionRow {
  id: number; sessionId: string; code: string; expiresAt: Date; used: boolean;
}

@Injectable()
export class OtpSessionRepository {
  private readonly logger = new Logger(OtpSessionRepository.name);

  async invalidatePending(identifier: string): Promise<Result<void>> {
    try {
      await db.update(otp_sessions)
        .set({ used: true })
        .where(and(eq(otp_sessions.identifier, identifier), eq(otp_sessions.used, false)));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async insert(identifier: string, code: string, expiresAt: Date): Promise<Result<string>> {
    try {
      const rows = await db.insert(otp_sessions).values({
        identifier,
        code,
        expires_at: expiresAt,
        used: false,
      }).returning({ session_id: otp_sessions.session_id });
      return Ok(String(rows[0]?.session_id ?? ''));
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async findBySessionId(sessionId: string): Promise<Result<OtpSessionRow | null>> {
    try {
      const rows = await db.select().from(otp_sessions)
        .where(and(sql`${otp_sessions.session_id}::uuid = ${sessionId}::uuid`, eq(otp_sessions.used, false)))
        .limit(1);
      if (rows.length === 0) return Ok(null);
      const r = rows[0];
      return Ok({
        id: Number(r.id),
        sessionId: String(r.session_id ?? ''),
        code: String(r.code ?? ''),
        expiresAt: r.expires_at ? new Date(r.expires_at) : _time.now(),
        used: Boolean(r.used),
      });
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  async markUsed(id: number): Promise<Result<void>> {
    try {
      await db.update(otp_sessions).set({ used: true }).where(eq(otp_sessions.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message); }
  }

  /**
   * Deletes OTP sessions whose `expires_at` is in the past. Called from the
   * session-cleanup cron (audit B.16) to keep the table bounded — without this
   * the table grows linearly with attempted logins.
   *
   * Returns the number of rows deleted so the caller can log / alert if the
   * value is unusually high (potential abuse signal).
   */
  async deleteExpired(): Promise<Result<number>> {
    try {
      const result = await db.execute(sql`
        DELETE FROM otp_sessions
        WHERE expires_at < NOW()
      `);
      const rowCount = (result as unknown as { rowCount?: number }).rowCount ?? 0;
      return Ok(rowCount);
    } catch (e: unknown) { return Err((e as Error).message); }
  }
}
