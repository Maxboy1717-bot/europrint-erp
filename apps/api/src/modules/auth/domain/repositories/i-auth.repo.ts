/**
 * @module i-auth.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { AuthUserAggregate } from '../aggregates/auth-user.aggregate';

/**
 * EP-ORG-003 card-gate ma'lumoti: user'ning aktiv lavozim-kartalari (employee_cards → org_departments)
 * soni + birlamchi karta + kartadan keladigan RBAC-tier + position. login.service + jwt.strategy o'qiydi.
 */
export interface CardGate {
  activeCardCount: number;
  primaryCardId: number | null;
  rbacTier: string | null;
  positionId: number | null;
}

export interface IAuthRepo {
  findByUsername(username: string): Promise<AuthUserAggregate | null>;
  findById(id: number): Promise<AuthUserAggregate | null>;
  save(user: AuthUserAggregate): Promise<AuthUserAggregate>;
  updateLastLogin(userId: number, ipAddress: string, timestamp: Date): Promise<void>;
  /**
   * C7.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): returns true only if THIS call performed the
   * token's first-ever revocation (atomic claim) — false if it was already revoked (by a
   * concurrent call or an earlier logout) or if the write itself failed. Callers that need the
   * "did I win the single-use race" guarantee (auth.controller.ts's refresh()) must check this
   * return value; fire-and-forget callers (logout.service.ts) may ignore it.
   */
  blacklistToken(token: string, expiresAt: Date): Promise<boolean>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  incrementFailedAttempts(userId: number): Promise<void>;
  lockUserAccount(userId: number, minutesDuration: number): Promise<void>;
  resetFailedAttempts(userId: number): Promise<void>;
  /** EP-ORG-003: aktiv-karta gate manbai (admin/super_admin bypass login.service'da). */
  resolveCardGate(userId: number): Promise<CardGate>;
}
