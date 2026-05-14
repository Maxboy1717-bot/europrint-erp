/**
 * @module drizzle-auth.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AuthUserAggregate, AuthUserData } from '../../domain/aggregates/auth-user.aggregate';
import { runQuery } from '@shared/db';
import { sql, type SQL } from 'drizzle-orm';

type RawUserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  last_login_at: Date | null;
  failed_login_attempts: number | null;
  locked_until: Date | null;
};

function rowToUserData(row: RawUserRow): AuthUserData {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
    lastLogin: row.last_login_at ?? null,
    failedLoginAttempts: row.failed_login_attempts ?? 0,
    lockUntil: row.locked_until ?? null,
  };
}

@Injectable()
export class DrizzleAuthRepo implements IAuthRepo {
  private readonly logger = new Logger(DrizzleAuthRepo.name);

  // ── Private helpers ────────────────────────────────────────────────

  /** SHA-256 token hash used for blacklist storage (avoids storing raw JWTs in DB) */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async findOneUser(where: SQL): Promise<AuthUserAggregate | null> {
    try {
      const r = await runQuery<RawUserRow>(sql`
        SELECT id, username, email, password_hash, role, is_active,
               last_login_at, failed_login_attempts, locked_until
        FROM users
        ${where}
        LIMIT 1
      `);
      return r.rows[0] ? new AuthUserAggregate(rowToUserData(r.rows[0])) : null;
    } catch (error: unknown) {
      this.logger.error(`findOneUser failed: ${error}`);
      return null;
    }
  }

  // ── IAuthRepo implementation ───────────────────────────────────────

  async findByUsername(username: string): Promise<AuthUserAggregate | null> {
    return this.findOneUser(sql`WHERE username = ${username}`);
  }

  async findById(id: number): Promise<AuthUserAggregate | null> {
    return this.findOneUser(sql`WHERE id = ${id}`);
  }

  async save(user: AuthUserAggregate): Promise<AuthUserAggregate> {
    try {
      const data = user.toPersistence();
      await runQuery(sql`
        UPDATE users
        SET password_hash         = ${data.passwordHash},
            last_login_at         = ${data.lastLogin},
            failed_login_attempts = ${data.failedLoginAttempts},
            locked_until          = ${data.lockUntil}
        WHERE id = ${data.id}
      `);
      return user;
    } catch (error: unknown) {
      this.logger.error(`save failed: ${error}`);
      throw error;
    }
  }

  async updateLastLogin(userId: number, _ipAddress: string, timestamp: Date): Promise<void> {
    try {
      await runQuery(sql`UPDATE users SET last_login_at = ${timestamp} WHERE id = ${userId}`);
    } catch (error: unknown) {
      this.logger.error(`updateLastLogin failed: ${error}`);
    }
  }

  async blacklistToken(token: string, _expiresAt: Date): Promise<void> {
    try {
      const hash = this.hashToken(token);
      await runQuery(sql`
        INSERT INTO refresh_tokens (token, is_revoked, expires_at, created_at)
        VALUES (${hash}, true, NOW() + INTERVAL '25 hours', NOW())
        ON CONFLICT (token) DO UPDATE SET is_revoked = true
      `);
    } catch (error: unknown) {
      this.logger.error(`blacklistToken failed: ${error}`);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const hash = this.hashToken(token);
      const r = await runQuery<{ is_revoked: boolean }>(sql`
        SELECT is_revoked FROM refresh_tokens
        WHERE token = ${hash} AND expires_at > NOW() LIMIT 1
      `);
      return r.rows[0]?.is_revoked === true;
    } catch (error: unknown) {
      this.logger.error(`isTokenBlacklisted failed: ${error}`);
      return false;
    }
  }

  async incrementFailedAttempts(userId: number): Promise<void> {
    try {
      await runQuery(sql`
        UPDATE users
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE
              WHEN failed_login_attempts + 1 >= 5
              THEN NOW() + INTERVAL '15 minutes'
              ELSE locked_until
            END
        WHERE id = ${userId}
      `);
    } catch (error: unknown) {
      this.logger.error(`incrementFailedAttempts failed: ${error}`);
    }
  }

  async lockUserAccount(userId: number, minutesDuration: number): Promise<void> {
    try {
      await runQuery(sql`
        UPDATE users
        SET locked_until = NOW() + (${minutesDuration} * INTERVAL '1 minute')
        WHERE id = ${userId}
      `);
    } catch (error: unknown) {
      this.logger.error(`lockUserAccount failed: ${error}`);
    }
  }

  async resetFailedAttempts(userId: number): Promise<void> {
    try {
      await runQuery(sql`
        UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ${userId}
      `);
    } catch (error: unknown) {
      this.logger.error(`resetFailedAttempts failed: ${error}`);
    }
  }
}
