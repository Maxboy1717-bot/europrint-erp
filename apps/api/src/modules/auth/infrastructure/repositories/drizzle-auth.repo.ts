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
import { MAX_FAILED_LOGIN_ATTEMPTS } from '@common/constants/security.constants';

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
  /**
   * C7.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): the old ON CONFLICT ... DO UPDATE SET
   * is_revoked = true unconditionally "succeeded" whether this call was the token's first
   * revocation or its hundredth — the caller (auth.controller.ts's refresh()) had no way to
   * tell "did I just win the single-use claim" from "this was already revoked". Two concurrent
   * refresh() calls with the same old token could BOTH pass a separate isTokenBlacklisted()
   * check before either blacklisted, both mint new pairs -> two live sessions from one
   * single-use refresh token.
   *
   * Fix: add `WHERE refresh_tokens.is_revoked = false` to the DO UPDATE action + RETURNING jti.
   * Postgres row-level locking on the UPDATE serializes concurrent claims against the same jti
   * row — only the FIRST caller's write actually flips is_revoked false->true and gets a row
   * back; a second concurrent (or later) call sees is_revoked already true, the WHERE excludes
   * it, RETURNING yields nothing. Returns true only for that winning first-time transition.
   *
   * KNOWN LIMITATION (unchanged from before this fix): tokens with no jti (legacy format) never
   * hit the partial unique index at all, so ON CONFLICT never fires and every call plain-INSERTs
   * a new row — the single-use race is NOT closed for that legacy path. All tokens minted by the
   * current login/refresh flow carry a jti; this only affects pre-existing legacy-format tokens.
   */
  async blacklistToken(token: string, _expiresAt: Date): Promise<boolean> {
    try {
      const hash = this.hashToken(token);
      const payload = this.extractPayload(token);
      // T8-03 fix: `sub` JWT-da NUMBER (JwtPayload.sub: number, login `sub: user.getId()`),
      // eski kod faqat `typeof === 'string'` qabul qilardi → har doim null → blacklist YOZMASDI
      // (jim no-op). Endi number/string ikkalasini ham qabul qilamiz.
      const jti      = typeof payload?.['jti'] === 'string' ? payload['jti'] : null;
      const subRaw   = payload?.['sub'];
      const userIdTx = (typeof subRaw === 'number' || typeof subRaw === 'string') ? String(subRaw) : null;

      if (!jti) {
        // Payload noto'g'ri / jti yo'q — token eskiroq formatda. token-hash bilan baribir yozamiz.
        this.logger.warn(`blacklistToken: jti yo'q — token-hash bilan yoziladi`);
      }

      // `id` UUID NOT NULL, DB-default YO'Q (Drizzle $defaultFn faqat app-code'da ishlaydi) →
      // gen_random_uuid() bilan beriladi, aks holda insert "id NOT NULL" da yiqiladi.
      const result = await runQuery<{ jti: string | null }>(sql`
        INSERT INTO refresh_tokens (id, token, jti, user_id_text, is_revoked, expires_at, created_at)
        VALUES (gen_random_uuid(), ${hash}, ${jti}, ${userIdTx}, true, NOW() + INTERVAL '25 hours', NOW())
        ON CONFLICT (jti) WHERE jti IS NOT NULL
        DO UPDATE SET is_revoked = true
        WHERE refresh_tokens.is_revoked = false
        RETURNING jti
      `);
      const won = result.rows.length > 0;
      this.logger.log(`blacklistToken: jti=${jti ?? '(yo\'q)'} ${won ? "qora ro'yxatga qo'shildi (birinchi)" : 'allaqachon bekor qilingan (poyga yutqazdi)'}`);
      return won;
    } catch (error: unknown) {
      this.logger.error(`blacklistToken failed: ${error}`);
      return false;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const hash = this.hashToken(token);
      // T8-03: token-HASH yoki jti bo'yicha tekshir. Logout access-token'ni jti bilan blacklist
      // qiladi; access va refresh AYNI jti'ni saqlaydi (login bitta payload imzolaydi) → refresh
      // endpoint shu jti orqali ham revoke'ni ko'radi (faqat token-hash emas).
      const payload = this.extractPayload(token);
      const jti = typeof payload?.['jti'] === 'string' ? payload['jti'] : null;
      const r = await runQuery<{ is_revoked: boolean }>(sql`
        SELECT is_revoked FROM refresh_tokens
        WHERE expires_at > NOW()
          AND (token = ${hash} OR (${jti}::text IS NOT NULL AND jti = ${jti}))
          AND is_revoked = true
        LIMIT 1
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
              WHEN failed_login_attempts + 1 >= ${MAX_FAILED_LOGIN_ATTEMPTS}
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
      // T1/A3: birlamchi karta = users.card_id (kanonik link), fallback employee_cards is_primary.
      // rbac_tier (qo'lda override) + razryad-daraja o'sha birlamchi kartadan; samarali tier JS'da
      // resolveEffectiveRbacTier orqali (yagona qoida — @common/constants/rbac-tier.policy).
      const r = await runQuery<{ active_card_count: number; primary_card_id: number | null; rbac_tier: string | null; primary_razryad_level: number | null; position_id: number | null }>(sql`
        WITH usr AS (SELECT id, employee_id, position_id, card_id FROM users WHERE id = ${userId}),
        prim AS (
          SELECT COALESCE(
            (SELECT card_id FROM usr),
            (SELECT ec.card_id FROM employee_cards ec
              WHERE ec.employee_id = (SELECT employee_id FROM usr) AND ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW())
              ORDER BY ec.is_primary DESC, ec.assigned_at DESC NULLS LAST LIMIT 1)
          ) AS card_id
        )
        SELECT
          (SELECT COUNT(*) FROM employee_cards ec WHERE ec.employee_id = (SELECT employee_id FROM usr)
            AND ec.is_active = true AND (ec.ended_at IS NULL OR ec.ended_at > NOW()))::int AS active_card_count,
          (SELECT card_id FROM prim) AS primary_card_id,
          (SELECT od.rbac_tier FROM org_departments od WHERE od.id = (SELECT card_id FROM prim)) AS rbac_tier,
          (SELECT rl.level FROM org_departments od LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
            WHERE od.id = (SELECT card_id FROM prim)) AS primary_razryad_level,
          (SELECT position_id FROM usr) AS position_id
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
