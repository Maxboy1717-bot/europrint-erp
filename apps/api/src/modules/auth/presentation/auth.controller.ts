/**
 * @module auth.controller
 * @description Session HTTP surface — login, logout, refresh. Profile/OTP/me/health
 * endpoints live in `auth-account.controller.ts` per Rule 16 (≤ 300 lines). Both
 * controllers share the `/auth` prefix and AuthThrottle so consumers see no change.
 * Each command delegates to a CQRS handler; the controller stays purely transport.
 */

import { unwrapOrThrow } from '@common/http-result';
import { Body, Controller, Headers, HttpCode, HttpStatus, Inject, Post, Req, Res, Logger, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { AuthThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { I18nService } from 'nestjs-i18n';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginService, LoginCommand } from '../application/services/login.service';
import { LogoutService, LogoutCommand } from '../application/services/logout.service';
import { LoginDto, LoginSchema } from './dto/login.dto';
import { CurrentUser } from '../infrastructure/decorators/current-user.decorator';
import { Public } from '../infrastructure/decorators/public.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IAuthRepo } from '../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../auth.tokens';
import { AuthenticatedUser } from '../domain/types';
import { assertOk } from '@common/http-result';

export { AuthAccountController } from './auth-account.controller';

// ─── Cookie configuration ───────────────────────────────────────────────────
// Access token cookie: short-lived (15m, vizyon), sent to every /api/* request.
// Refresh token cookie: longer-lived (7d), restricted to /api/auth path
// (defense in depth — refresh token never leaves the auth surface).
// Both cookies are httpOnly so JavaScript on the page cannot read them; this
// neutralises XSS-based session theft.
// sameSite=strict blocks cross-site form submits / link clicks from sending
// the cookie — sufficient CSRF mitigation for MVP without a separate token.
const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
// T10-17: access cookie umri = access-token TTL (vizyon 15 daqiqa) — token o'lib, cookie
// 24h yashab qolishi (drift) oldini oladi. Refresh cookie uzun (7d) → refresh oqimi yangi
// access mint qiladi, foydalanuvchi qayta login qilmaydi.
const ACCESS_COOKIE_MAX_AGE_SEC = 15 * 60; // 15 minutes
const REFRESH_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

/**
 * Build cookie options. Marked `secure` only in production so local HTTP dev works.
 * `sameSite=strict` mitigates CSRF; combined with httpOnly it also neutralises XSS.
 */
type CookieOpts = { httpOnly: true; secure: boolean; sameSite: 'strict'; path: string; maxAge: number };
function cookieOpts(nodeEnv: string | undefined, path: string, maxAge: number): CookieOpts {
  return { httpOnly: true, secure: nodeEnv === 'production', sameSite: 'strict', path, maxAge };
}
const accessCookieOpts = (env: string | undefined) => cookieOpts(env, '/', ACCESS_COOKIE_MAX_AGE_SEC);
const refreshCookieOpts = (env: string | undefined) => cookieOpts(env, '/api/auth', REFRESH_COOKIE_MAX_AGE_SEC);

/**
 * FastifyReply at runtime exposes `setCookie` / `clearCookie` only when
 * `@fastify/cookie` is registered. We guard the call so that, if the plugin
 * failed to load (logged in main.ts), the controller still returns the JSON
 * body and the old Bearer-token flow keeps working.
 */
type CookieCapableReply = FastifyReply & {
  setCookie?: (name: string, value: string, opts: Record<string, unknown>) => unknown;
  clearCookie?: (name: string, opts?: Record<string, unknown>) => unknown;
};

@AuthThrottle() // 5 req/min — slows credential stuffing
@UseInterceptors(AuditInterceptor)
@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly loginHandler: LoginService,
    private readonly logoutHandler: LogoutService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly i18n: I18nService,
  ) {}

  /**
   * POST /auth/login — exchange username/password for access + refresh tokens.
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimga kirish' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: CookieCapableReply,
  ) {
    const validated = LoginSchema.parse(dto);
    const command: LoginCommand = {
      username:  validated.username,
      password:  validated.password,
      ipAddress: (req.ip as string) || 'unknown',
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
    };
    const result = await this.loginHandler.execute(command);
    const payload = unwrapOrThrow(result) as { accessToken: string; refreshToken: string; user: unknown };

    // Phase 1: set httpOnly cookies in ADDITION to returning tokens in the body.
    if (typeof reply.setCookie === 'function') {
      reply.setCookie(ACCESS_COOKIE_NAME, payload.accessToken, accessCookieOpts(this.configService.get<string>('NODE_ENV')));
      reply.setCookie(REFRESH_COOKIE_NAME, payload.refreshToken, refreshCookieOpts(this.configService.get<string>('NODE_ENV')));
    }

    return payload;
  }

  /**
   * POST /auth/logout — revokes the current access token (adds jti to blacklist).
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tizimdan chiqish' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest & { cookies?: Record<string, string | undefined> },
    @Res({ passthrough: true }) reply: CookieCapableReply,
  ) {
    const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
    const authHeader = req.headers['authorization'] as string | undefined;
    const headerToken = authHeader?.replace(/^Bearer\s+/i, '') || '';
    const token = cookieToken || headerToken;
    // T8-03 xavfsizlik: refresh-token ham revoke qilinadi — aks holda chiqib ketgandan keyin
    // ham eski refresh-token /auth/refresh orqali yangi access-token mint qilaverardi.
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const command: LogoutCommand = { token, userId: user.id, refreshToken };
    const result = await this.logoutHandler.execute(command);
    assertOk(result);

    if (typeof reply.clearCookie === 'function') {
      reply.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    }

    return { message: 'Successfully logged out' };
  }

  /**
   * POST /auth/refresh — exchange a valid refresh token for a fresh access token
   * AND a fresh refresh token (rotation). The OLD refresh token is atomically
   * claimed (revoked) BEFORE a new pair is minted (C7.6 fix) — single-use,
   * race-free even under concurrent refresh calls with the same old token.
   * Uses JWT_REFRESH_SECRET (NOT JWT_SECRET) to verify, so an exfiltrated
   * access token cannot be replayed here.
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'JWT tokenni yangilash (refresh + rotation)' })
  async refresh(
    @Headers('authorization') auth: string,
    @Req() req: FastifyRequest & { cookies?: Record<string, string | undefined> },
    @Res({ passthrough: true }) reply: CookieCapableReply,
  ) {
    const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const headerToken = auth?.replace(/^Bearer\s+/i, '');
    const oldRefreshToken = cookieToken || headerToken;
    if (!oldRefreshToken) throw new UnauthorizedException(await this.i18n.t('auth.tokenRequired'));

    try {
      // getOrThrow: fail loudly if JWT_REFRESH_SECRET is missing — never fall back to JWT_SECRET
      const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify(oldRefreshToken, { secret: refreshSecret });

      // C7.6 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): atomically CLAIM (revoke) the old refresh
      // token BEFORE minting a new pair — this is what actually closes the race, not a separate
      // check-then-mint-then-revoke sequence. Two concurrent requests with the same old token:
      // only one's claim can win (blacklistToken()'s guarded UPDATE is serialized by Postgres
      // row-level locking); the loser is rejected here and never mints a second live pair.
      // Replaces the old separate isTokenBlacklisted() pre-check, which left exactly this gap
      // open (both requests could pass it before either blacklisted).
      const oldExpiresAt = typeof payload.exp === 'number'
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_SEC * 1000);
      const claimed = await this.authRepo.blacklistToken(oldRefreshToken, oldExpiresAt);
      if (!claimed) throw new UnauthorizedException(await this.i18n.t('auth.tokenRevoked'));

      // Issue NEW access token (same lifetime / claims as login).
      // T10-17: 15-daqiqalik access TTL — login.service bilan bir manba (JWT_ACCESS_TOKEN_TTL).
      const accessToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username, role: payload.role },
        { expiresIn: (this.configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '15m') as SignOptions['expiresIn'] },
      );

      // Issue NEW refresh token — signed with JWT_REFRESH_SECRET, longer lifetime.
      const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
      const refreshToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username, role: payload.role },
        { secret: refreshSecret, expiresIn: refreshExpiresIn },
      );

      // Rotate both cookies on the response so the browser picks up the new pair.
      if (typeof reply.setCookie === 'function') {
        reply.setCookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOpts(this.configService.get<string>('NODE_ENV')));
        reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOpts(this.configService.get<string>('NODE_ENV')));
      }

      return { accessToken, refreshToken };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException(await this.i18n.t('auth.tokenExpired'));
    }
  }
}
