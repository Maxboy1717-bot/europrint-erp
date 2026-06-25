/**
 * @module drizzle-auth.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: CASE WHEN expression in SET clause (atomic increment +
 *   conditional lockout: `failed_login_attempts + 1` with `CASE WHEN ... >= 5
 *   THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END`), column-to-
 *   column self-reference in UPDATE (`failed_login_attempts = failed_login_attempts + 1`),
 *   `ON CONFLICT (token) DO UPDATE SET is_revoked = true`, and dynamic SQL
 *   fragment composition (variable WHERE clause via `${where}` SQL param).
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { IAuthRepo, CardGate } from '../../domain/repositories/i-auth.repo';
import { AuthUserAggregate, AuthUserData } from '../../domain/aggregates/auth-user.aggregate';
import { runQuery } from '@shared/db';
import { sql, type SQL } from 'drizzle-orm';
import { resolveEffectiveRbacTier } from '@common/constants/rbac-tier.policy';

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

  /**
   * JWT payload'ini verify qilmasdan decode qiladi (imzo allaqachon JwtService tomonidan
   * tekshirilgan). jti va sub (user UUID) ni chiqarib olish uchun ishlatiladi.
   */
  private extractPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) return null;
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
    } catch {
      return null;
    }
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

  /**
   * BLOCKER-2 fix: Access token logout qora ro'yxatga qo'shish.
   *
   * Muammo: logout token HASH saqlar edi, lekin JwtAuthGuard jti orqali
   * tekshirar edi → mismatch → logout hech nima qilmasdi.
   *
   * Yechim: JWT payload'ini decode qilib, jti (UUID) va sub (user UUID) ni
   * chiqarib olamiz. refresh_tokens ga (token_hash, jti, user_id) bilan
   * INSERT qilamiz. ON CONFLICT (jti) — unikal constraint mavjud.
   * Guard `WHERE jti = $jti AND is_revoked = true` → endi topiladi.
   */
  async blacklistToken(token: string, _expiresAt: Date): Promise<void> {
    try {
      const hash = this.hashToken(token);
      const payload = this.extractPayload(token);
      const jti    = typeof payload?.['jti'] === 'string' ? payload['jti'] : null;
      const userId = typeof payload?.['sub'] === 'string' ? payload['sub'] : null;

      if (!jti || !userId) {
        // Payload noto'g'ri — token allaqachon buzilgan yoki eskiroq formatda
        this.logger.warn(`blacklistToken: payload noto'g'ri (jti=${jti}, sub=${userId}) — o'tkazildi`);
        return;
      }

      // Guard jti orqali tekshiradi:
      //   SELECT is_revoked FROM refresh_tokens WHERE jti = $jti
      // ON CONFLICT (jti) — refresh_tokens.jti ustunida UNIQUE index bor (schema-core.ts)
      await runQuery(sql`
        INSERT INTO refresh_tokens (token, jti, user_id, is_revoked, expires_at, created_at)
        VALUES (${hash}, ${jti}, ${userId}, true, NOW() + INTERVAL '25 hours', NOW())
        ON CONFLICT (jti) DO UPDATE SET is_revoked = true
      `);
      this.logger.log(`blacklistToken: jti=${jti} qora ro'yxatga qo'shildi`);
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

  /**
   * EP-ORG-003 card-gate manbai: user'ning aktiv lavozim-kartalari soni + birlamchi karta + rbac-tier + position.
   * Yo'l: users.employee_id → employee_cards (is_active, NOT ended) → org_departments (FAZA-00 kanonik).
   * Xato → empty (0 karta); login.service admin/super_admin'ni undan oldin bypass qiladi (fail-closed oddiy user).
   */
  async resolveCardGate(userId: number): Promise<CardGate> {
    const empty: CardGate = { activeCardCount: 0, primaryCardId: null, rbacTier: null, positionId: null };
    try {
      // Birlamchi karta: rbac_tier (qo'lda override) + razryad-daraja (egasi razryad→tier qoidasi manbai).
      // Samarali tier JS'da resolveEffectiveRbacTier orqali (yagona qoida — @common/constants/rbac-tier.policy).
      const r = await runQuery<{ active_card_count: number; primary_card_id: number | null; rbac_tier: string | null; primary_razryad_level: number | null; position_id: number | null }>(sql`
        SELECT
          COUNT(ec.id) FILTER (WHERE ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_card_count,
          (SELECT od.id FROM employee_cards ec2 JOIN org_departments od ON od.id = ec2.card_id
            WHERE ec2.employee_id = u.employee_id AND ec2.is_active = true AND (ec2.ended_at IS NULL OR ec2.ended_at > NOW())
            ORDER BY ec2.is_primary DESC, ec2.assigned_at DESC NULLS LAST LIMIT 1) AS primary_card_id,
          (SELECT od.rbac_tier FROM employee_cards ec3 JOIN org_departments od ON od.id = ec3.card_id
            WHERE ec3.employee_id = u.employee_id AND ec3.is_active = true AND (ec3.ended_at IS NULL OR ec3.ended_at > NOW())
            ORDER BY ec3.is_primary DESC, ec3.assigned_at DESC NULLS LAST LIMIT 1) AS rbac_tier,
          (SELECT rl.level FROM employee_cards ec4 JOIN org_departments od ON od.id = ec4.card_id
            LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
            WHERE ec4.employee_id = u.employee_id AND ec4.is_active = true AND (ec4.ended_at IS NULL OR ec4.ended_at > NOW())
            ORDER BY ec4.is_primary DESC, ec4.assigned_at DESC NULLS LAST LIMIT 1) AS primary_razryad_level,
          u.position_id AS position_id
        FROM users u
        LEFT JOIN employee_cards ec ON ec.employee_id = u.employee_id
        WHERE u.id = ${userId}
        GROUP BY u.id, u.employee_id, u.position_id
        LIMIT 1
      `);
      const row = r.rows[0];
      if (!row) return empty;
      return {
        activeCardCount: Number(row.active_card_count ?? 0),
        primaryCardId: row.primary_card_id ?? null,
        rbacTier: resolveEffectiveRbacTier(row.rbac_tier ?? null, row.primary_razryad_level == null ? null : Number(row.primary_razryad_level)),
        positionId: row.position_id ?? null,
      };
    } catch (error: unknown) {
      this.logger.error(`resolveCardGate failed: ${error}`);
      return empty;
    }
  }
}
