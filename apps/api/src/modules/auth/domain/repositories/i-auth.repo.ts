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
  blacklistToken(token: string, expiresAt: Date): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  incrementFailedAttempts(userId: number): Promise<void>;
  lockUserAccount(userId: number, minutesDuration: number): Promise<void>;
  resetFailedAttempts(userId: number): Promise<void>;
  /** EP-ORG-003: aktiv-karta gate manbai (admin/super_admin bypass login.service'da). */
  resolveCardGate(userId: number): Promise<CardGate>;
}
