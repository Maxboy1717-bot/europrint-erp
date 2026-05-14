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
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

/**
 * Default route guard. Verifies the JWT in `Authorization: Bearer ...`,
 * attaches `request.user`, and short-circuits on `@Public()` metadata.
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
  ) {}

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
    const token = request.headers?.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token topilmadi');
    }

    try {
      const decoded = this.jwtService.verify(token) as Record<string, unknown>;
      // Payload validation — har bir token kamida `sub`/`id`/`userId` dan birini saqlashi shart.
      const userId = decoded['sub'] ?? decoded['id'] ?? decoded['userId'];
      if (!userId) {
        throw new UnauthorizedException('Token payload yaroqsiz: foydalanuvchi identifikatori yo\'q');
      }
      // Muddat tugagani — additional sanity check (jwtService.verify also checks this)
      const exp = decoded['exp'] as number | undefined;
      if (exp && exp * 1000 < Date.now()) {
        throw new UnauthorizedException('Token muddati tugagan');
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
            throw new UnauthorizedException('Token bekor qilingan');
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
      throw new UnauthorizedException('Token yaroqsiz yoki muddati tugagan');
    }
  }
}
