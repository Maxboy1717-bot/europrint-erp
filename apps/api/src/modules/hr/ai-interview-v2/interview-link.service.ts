// NOTE: RULE4_EXCEPTION — raw SQL retained: ai_interview_links table has no
// Drizzle schema; single-use token lookup and expiry checks require
// date-arithmetic expressions not expressible via Drizzle query builder.
/**
 * @module interview-link.service
 * @description Generate single-use, time-limited (24h) interview links sent to
 *   candidates via Telegram. Each link unlocks the AI Live Interview page for
 *   a specific candidate + session.
 *
 *   Link format: https://{frontend}/interview/{tokenId}
 *   Token: random 32-byte URL-safe string stored in `ai_interview_links`.
 *
 * @layer Service (HR)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export interface InterviewLink {
  tokenId: string;
  url: string;
  candidateId: number;
  expiresAt: Date;
  used: boolean;
}

@Injectable()
export class InterviewLinkService {
  private readonly logger = new Logger(InterviewLinkService.name);
  constructor(private readonly cfg: ConfigService) {}

  async createLink(candidateId: number, ttlHours = 24): Promise<Result<InterviewLink>> {
    return safeCall(async () => {
      const tokenId = randomBytes(24).toString('base64url');
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
      const baseUrl = this.cfg.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
      await db.execute(sql`
        INSERT INTO ai_interview_links (token_id, candidate_id, expires_at, used, created_at)
        VALUES (${tokenId}, ${candidateId}, ${expiresAt}, false, NOW())
      `);
      const url = `${baseUrl}/interview/${tokenId}`;
      this.logger.log(`Interview link created for candidate ${candidateId}: expires ${expiresAt.toISOString()}`);
      return { tokenId, url, candidateId, expiresAt, used: false };
    }, 'DB_ERROR');
  }

  async validateToken(tokenId: string): Promise<Result<InterviewLink>> {
    const queryResult = await safeCall(async () => {
      const rows = await db.execute(sql`
        SELECT token_id, candidate_id, expires_at, used
        FROM ai_interview_links
        WHERE token_id = ${tokenId}
        LIMIT 1
      `);
      return (rows as unknown as { rows: Array<{
        token_id: string; candidate_id: number; expires_at: Date; used: boolean;
      }> }).rows[0] ?? null;
    }, 'NOT_FOUND');
    if (!queryResult.ok) return Err(queryResult.error);
    const row = queryResult.data;
    if (!row) return Err({ code: 'NOT_FOUND', message: 'Token not found' });
    if (row.used) return Err({ code: 'CONFLICT', message: 'Token already used' });
    if (new Date(row.expires_at) < new Date()) return Err({ code: 'NOT_FOUND', message: 'Token expired' });
    const baseUrl = this.cfg.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return Ok({
      tokenId: row.token_id, candidateId: row.candidate_id,
      expiresAt: row.expires_at, used: row.used,
      url: `${baseUrl}/interview/${row.token_id}`,
    });
  }

  async markUsed(tokenId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.execute(sql`
        UPDATE ai_interview_links SET used = true, used_at = NOW()
        WHERE token_id = ${tokenId}
      `);
    }, 'DB_ERROR');
  }
}
