/**
 * @module login.handler
 * @description CQRS handler for `POST /auth/login`. Verifies credentials,
 * enforces lockout after 5 failed attempts, signs access + refresh tokens
 * (refresh uses a separate JWT_REFRESH_SECRET), records audit log row.
 * Returns `Result<AuthResult>` — audit-log failure never breaks the login.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppError, AppErr, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';
import { AuthResult, AuthErrorCode } from '../../domain/types';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
/**
 * Inbound command shape for {@link LoginHandler.execute}.
 * @property username - case-sensitive username (or email; resolved by repo)
 * @property password - plain-text password to verify against bcrypt hash
 * @property ipAddress - request IP, used for audit log
 * @property userAgent - request User-Agent, used for audit log
 */
export interface LoginCommand {
  username: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}
export type LoginCommandResult =
  | { ok: true; data: AuthResult }
  | { ok: false; error: AppError };
/**
 * Authentication command handler. Holds zero state; safe to inject anywhere.
 */
@Injectable()
export class LoginHandler {
  private readonly logger = new Logger(LoginHandler.name);
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Runs the login use-case end-to-end.
   * Steps (each fails closed and returns an Err Result):
   *  1. Resolve user by username
   *  2. Reject if locked / inactive
   *  3. Verify password (bcrypt); increment failed-attempt counter on miss
   *  4. Reset counter, update last-login timestamp
   *  5. Sign access (8h) and refresh (30d) tokens
   *  6. Best-effort audit log insert (errors swallowed)
   * @param command - credentials + request metadata
   * @returns Result.ok({ accessToken, refreshToken, user }) on success
   * @returns Result.err(AppErr('UNAUTHORIZED', code)) on every failure path
   * @throws never — every error becomes a Result
   */
  async execute(command: LoginCommand): Promise<LoginCommandResult> {
      const user = await this.authRepo.findByUsername(command.username);
      if (!user) {
        this.logger.warn({ username: command.username }, 'User not found');
        const event = UserLoggedInEvent.create(0, command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.USER_NOT_FOUND));
      }
      if (user.isAccountLocked()) {
        this.logger.warn({ userId: user.getId() }, 'Account locked');
        const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.ACCOUNT_LOCKED));
      }
      if (!user.isAccountActive()) {
        this.logger.warn({ userId: user.getId() }, 'Account inactive');
        const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.ACCOUNT_INACTIVE));
      }
      const isPasswordValid = await user.verifyPassword(command.password);
      if (!isPasswordValid) {
        // Single atomic SQL: increments counter and sets locked_until when threshold reached
        await this.authRepo.incrementFailedAttempts(user.getId());
        user.incrementFailedAttempts();
        if (user.getFailedLoginAttempts() >= 5) {
          this.logger.warn({ userId: user.getId() }, 'Account locked due to failed attempts');
        }
        const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, false);
        await this.auditLog(event);
        return Err(AppErr('UNAUTHORIZED', AuthErrorCode.INVALID_CREDENTIALS));
      }
      user.resetFailedAttempts();
      user.updateLastLogin(_time.now());
      await this.authRepo.resetFailedAttempts(user.getId());
      await this.authRepo.updateLastLogin(user.getId(), command.ipAddress, _time.now());
      const payload = {
        sub: user.getId(),
        username: user.getUsername(),
        email: user.getEmail(),
        role: user.getRole(),
      };
      const accessToken  = this.jwtService.sign(payload, { expiresIn: '8h' });
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '30d',
        secret: process.env['JWT_REFRESH_SECRET'],
      });
      const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, true);
      await this.auditLog(event);
      this.logger.log(`User logged in: ${user.getUsername()} from ${command.ipAddress}`);
      return {
        ok: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.getId(),
            username: user.getUsername(),
            email: user.getEmail(),
            role: user.getRole(),
          },
        },
      };
  }
  private async auditLog(event: UserLoggedInEvent): Promise<void> {
    this.logger.log(
      `Auth audit: userId=${event.userId} ip=${event.ipAddress} success=${event.success}`,
    );
    try {
      await runQuery(sql`
        INSERT INTO audit_logs (user_id, action, ip_address, created_at)
        VALUES (${event.userId}, 'login', ${event.ipAddress}, NOW())
      `);
    } catch (err: unknown) {
      // Audit failure must never break the login flow
      this.logger.warn(`Audit log insert failed: ${String(err)}`);
    }
  }
}