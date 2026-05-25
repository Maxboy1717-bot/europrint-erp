/**
 * @module jwt-auth.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/**
 * Default route guard. Verifies the JWT from either the `access_token`
 * httpOnly cookie (preferred — XSS-safe) or the `Authorization: Bearer ...`
 * header (legacy — for API tools / older clients). Attaches `request.user`
 * and short-circuits on `@Public()` metadata.
 *
 * Token blacklist: when the access token carries a `jti` claim, the guard
 * checks `refresh_tokens.is_revoked` for that jti. DB errors during the
 * blacklist check fail open (returns true) to avoid an outage cascading
 * from one slow query.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Extract a JWT from the request. Prefers the httpOnly cookie (more secure
   * — JavaScript cannot read it, so XSS cannot exfiltrate it) and falls back
   * to `Authorization: Bearer <token>` for backward compatibility.
   */
  private extractToken(request: {
    cookies?: Record<string, string | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  }): string | undefined {
    // 1) Preferred: httpOnly cookie set by /auth/login or /auth/refresh
    const cookieToken = request.cookies?.['access_token'];
    if (cookieToken) return cookieToken;

    // 2) Fallback: Authorization header (Bearer scheme)
    const authHeader = request.headers?.authorization;
    if (typeof authHeader === 'string') {
      const [scheme, value] = authHeader.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && value) return value;
    }
    return undefined;
  }

  /**
   * Verifies the request's JWT and authorizes the handler.
   * @param context - NestJS execution context
   * @returns true when the route may proceed
   * @throws UnauthorizedException when token is missing, malformed, expired, revoked, or has no user id
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(await this.i18n.t('auth.tokenRequired'));
    }

    try {
      const decoded = this.jwtService.verify(token) as Record<string, unknown>;
      // Payload validation — har bir token kamida `sub`/`id`/`userId` dan birini saqlashi shart.
      const userId = decoded['sub'] ?? decoded['id'] ?? decoded['userId'];
      if (!userId) {
        throw new UnauthorizedException(await this.i18n.t('auth.tokenInvalid'));
      }
      // Muddat tugagani — additional sanity check (jwtService.verify also checks this)
      const exp = decoded['exp'] as number | undefined;
      if (exp && exp * 1000 < Date.now()) {
        throw new UnauthorizedException(await this.i18n.t('auth.tokenExpired'));
      }

      // Blacklist check — verify the access token has not been revoked via its jti claim.
      // Access tokens are distinct from refresh tokens; we check revocation by jti, not by
      // hashing the raw access token against the refresh_tokens table (which was incorrect).
      const jti = decoded['jti'] as string | undefined;
      if (jti) {
        try {
          const blacklistResult = await runQuery<{ is_revoked: boolean }>(sql`
            SELECT is_revoked FROM refresh_tokens
            WHERE jti = ${jti}
            LIMIT 1
          `);
          if (blacklistResult.rows[0]?.is_revoked === true) {
            throw new UnauthorizedException(await this.i18n.t('auth.tokenRevoked'));
          }
        } catch (blacklistErr) {
          // Re-throw UnauthorizedException from blacklist check; ignore DB errors gracefully
          if (blacklistErr instanceof UnauthorizedException) throw blacklistErr;
          // DB unavailable — fail open to avoid outage; log but continue
        }
      }

      request.user = { ...decoded, id: userId };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(await this.i18n.t('auth.tokenInvalid'));
    }
  }
}
