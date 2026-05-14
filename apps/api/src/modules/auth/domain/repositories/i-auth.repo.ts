/**
 * @module i-auth.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { AuthUserAggregate } from '../aggregates/auth-user.aggregate';

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
}
