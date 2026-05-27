/**
 * @module login.service
 * @description Application service (formerly login.handler) for `POST /auth/login`.
 *   Verifies credentials, enforces lockout after 5 failed attempts, signs access +
 *   refresh tokens (refresh uses a separate JWT_REFRESH_SECRET), records audit log.
 *   Returns `Result<AuthResult>` — audit-log failure never breaks the login.
 *
 *   The class was never an `ICommandHandler<T>` and never registered with the CQRS
 *   bus — the controller injects it directly and calls `execute()`. Renamed
 *   handler→service so the file location matches its real role (audit P0-7).
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: the audit_logs table is not present in the Drizzle schema barrel
 *   for this module (lives outside auth bounded context), and the INSERT uses
 *   `NOW()` server-side timestamp expression for created_at.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppError, AppErr, Err } from '@common/result';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { IAuthRepo } from '../../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../../auth.tokens';
import { IPasswordHasher, PASSWORD_HASHER } from '../../domain/ports/i-password-hasher.port';
import { AuthResult, AuthErrorCode } from '../../domain/types';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

/**
 * i18n PATTERN (Backend Task Group 3 — Reference Implementation)
 * --------------------------------------------------------------
 * This service is the canonical example of localised error messages.
 *
 * 1. Inject `I18nService` via constructor.
 * 2. Resolve a translation via `await this.i18n.t('namespace.key')`.
 *    Translation keys live under `apps/api/src/i18n/<lang>/<namespace>.json`.
 * 3. Wrap the localised string in `AppErr(code, message)` so the Result
 *    pattern (Rule 1 in CLAUDE.md) is preserved end-to-end.
 *
 * The language is auto-resolved by `nestjs-i18n` from `Accept-Language`,
 * `x-lang`, or `?lang=` (configured in `app.module.ts`). No request-context
 * plumbing is needed in callers — `i18n.t()` reads the current request.
 *
 * Mass migration of every service is OUT OF SCOPE. Use this as the template
 * when you touch a service for unrelated reasons. See `apps/api/src/i18n/README.md`.
 */
/**
 * Inbound command shape for {@link LoginService.execute}.
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
 * Authentication application service. Holds zero state; safe to inject anywhere.
 */
@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);
  constructor(
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
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
      await this.auditFailure(0, command, AuthErrorCode.USER_NOT_FOUND);
      // i18n PATTERN: resolve the localised error message before wrapping
      // it in AppErr. Frontend's Accept-Language header picks uz or ru.
      const msg = await this.i18n.t('auth.invalidCredentials');
      return Err(AppErr('UNAUTHORIZED', msg));
    }
    const gateError = await this.checkAccountGates(user, command);
    if (gateError) {
      const msg = await this.resolveAuthErrorMessage(gateError);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    const credentialError = await this.verifyCredentials(user, command);
    if (credentialError) {
      const msg = await this.resolveAuthErrorMessage(credentialError);
      return Err(AppErr('UNAUTHORIZED', msg));
    }

    await this.recordSuccessfulLogin(user, command);
    return { ok: true, data: this.buildAuthResult(user) };
  }

  /**
   * Maps an internal `AuthErrorCode` enum value to a localised user-facing
   * message via `nestjs-i18n`. Keep this resolver narrow — it only handles
   * the auth namespace; other modules build their own resolvers next to
   * their services.
   */
  private async resolveAuthErrorMessage(code: AuthErrorCode): Promise<string> {
    switch (code) {
      case AuthErrorCode.USER_NOT_FOUND:
      case AuthErrorCode.INVALID_CREDENTIALS:
        return this.i18n.t('auth.invalidCredentials');
      case AuthErrorCode.ACCOUNT_LOCKED:
        return this.i18n.t('auth.accountLocked');
      case AuthErrorCode.ACCOUNT_INACTIVE:
        return this.i18n.t('auth.accountInactive');
      default:
        return this.i18n.t('errors.unauthorized');
    }
  }

  private async checkAccountGates(user: Awaited<ReturnType<IAuthRepo['findByUsername']>>, command: LoginCommand): Promise<AuthErrorCode | null> {
    if (!user) return AuthErrorCode.USER_NOT_FOUND;
    if (user.isAccountLocked()) {
      this.logger.warn({ userId: user.getId() }, 'Account locked');
      await this.auditFailure(user.getId(), command, AuthErrorCode.ACCOUNT_LOCKED);
      return AuthErrorCode.ACCOUNT_LOCKED;
    }
    if (!user.isAccountActive()) {
      this.logger.warn({ userId: user.getId() }, 'Account inactive');
      await this.auditFailure(user.getId(), command, AuthErrorCode.ACCOUNT_INACTIVE);
      return AuthErrorCode.ACCOUNT_INACTIVE;
    }
    return null;
  }

  private async verifyCredentials(user: NonNullable<Awaited<ReturnType<IAuthRepo['findByUsername']>>>, command: LoginCommand): Promise<AuthErrorCode | null> {
    const isPasswordValid = await user.verifyPassword(command.password, this.passwordHasher);
    if (isPasswordValid) return null;
    await this.authRepo.incrementFailedAttempts(user.getId());
    user.incrementFailedAttempts();
    if (user.getFailedLoginAttempts() >= 5) {
      this.logger.warn({ userId: user.getId() }, 'Account locked due to failed attempts');
    }
    await this.auditFailure(user.getId(), command, AuthErrorCode.INVALID_CREDENTIALS);
    return AuthErrorCode.INVALID_CREDENTIALS;
  }

  private async recordSuccessfulLogin(user: NonNullable<Awaited<ReturnType<IAuthRepo['findByUsername']>>>, command: LoginCommand): Promise<void> {
    user.resetFailedAttempts();
    user.updateLastLogin(_time.now());
    await this.authRepo.resetFailedAttempts(user.getId());
    await this.authRepo.updateLastLogin(user.getId(), command.ipAddress, _time.now());
    const event = UserLoggedInEvent.create(user.getId(), command.ipAddress, command.userAgent, true);
    await this.auditLog(event);
    this.logger.log(`User logged in: ${user.getUsername()} from ${command.ipAddress}`);
  }

  private buildAuthResult(user: NonNullable<Awaited<ReturnType<IAuthRepo['findByUsername']>>>): AuthResult {
    // SEC-3: jti (JWT ID) qo'shildi — logout blacklist JwtAuthGuard da ishlashi uchun
    const payload = {
      sub: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      role: user.getRole(),
      jti: randomUUID(),
    };
    // AUTH-1: JWT TTL = cookie maxAge (24h access, 7d refresh) — no more drift
    const accessToken  = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.getId(),
        username: user.getUsername(),
        email: user.getEmail(),
        role: user.getRole(),
      },
    };
  }

  private async auditFailure(userId: number, command: LoginCommand, _code: AuthErrorCode): Promise<void> {
    const event = UserLoggedInEvent.create(userId, command.ipAddress, command.userAgent, false);
    await this.auditLog(event);
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
