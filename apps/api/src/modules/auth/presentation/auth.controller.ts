/**
 * @module auth.controller
 * @description Authentication HTTP surface. Public endpoints for login,
 * refresh, OTP verification, and health; authenticated endpoints for logout,
 * password change, and `me`. Rate-limited at 5 requests / 60 s per route via
 * `@Throttle` to slow down credential stuffing. Every command delegates to a
 * CQRS handler; the controller stays purely transport.
 */

import { assertOk, unwrapOrThrow } from '@common/http-result';
import { assertAuth } from '@common/assertions';
import { BadRequestException, Body, Controller, Get, Headers, HttpCode, HttpStatus, Inject, Patch, Post, Req, Res, Logger, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginService, LoginCommand } from '../application/services/login.service';
import { LogoutService, LogoutCommand } from '../application/services/logout.service';
import { ChangePasswordService, ChangePasswordCommand } from '../application/services/change-password.service';
import { VerifyOtpService, VerifyOtpCommand } from '../application/services/verify-otp.service';
import { ResendOtpService, ResendOtpCommand } from '../application/services/resend-otp.service';
import { LoginDto, LoginSchema } from './dto/login.dto';
import { ChangePasswordDto, ChangePasswordSchema } from './dto/change-password.dto';
import { VerifyOtpSchema } from './dto/otp.dto';
import { CurrentUser } from '../infrastructure/decorators/current-user.decorator';
import { isErr } from '@common/result';
import { Public } from '../infrastructure/decorators/public.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IAuthRepo } from '../domain/repositories/i-auth.repo';
import { AUTH_REPO } from '../auth.tokens';

const AUTH_ERROR_CODES = new Set(['USER_NOT_FOUND', 'INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'ACCOUNT_INACTIVE']);

// ─── Cookie configuration ───────────────────────────────────────────────────
// Access token cookie: short-lived (24h), sent to every /api/* request.
// Refresh token cookie: longer-lived (7d), restricted to /api/auth path
// (defense in depth — refresh token never leaves the auth surface).
// Both cookies are httpOnly so JavaScript on the page cannot read them; this
// neutralises XSS-based session theft.
// sameSite=strict blocks cross-site form submits / link clicks from sending
// the cookie — sufficient CSRF mitigation for MVP without a separate token.
const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_MAX_AGE_SEC = 24 * 60 * 60; // 24 hours
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
    private readonly changePasswordHandler: ChangePasswordService,
    private readonly verifyOtpHandler: VerifyOtpService,
    private readonly resendOtpHandler: ResendOtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
    private readonly i18n: I18nService,
  ) {}

  /**
   * POST /auth/login — exchange username/password for access + refresh tokens.
   * @param dto - LoginDto, validated against LoginSchema (Zod)
   * @param req - FastifyRequest, used for IP/User-Agent audit logging
   * @param reply - FastifyReply (passthrough) used to set httpOnly cookies
   * @returns { accessToken, refreshToken, user } — body retained for backward
   *   compatibility (API testing tools / older clients reading from response).
   *   New clients SHOULD rely on cookies + `credentials: 'include'`.
   * @throws UnauthorizedException on bad credentials, locked, or inactive account
   * @throws BadRequestException on schema-validation failure (Zod)
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
    // Old clients (Bearer-only) keep working; new clients use the cookie.
    if (typeof reply.setCookie === 'function') {
      reply.setCookie(ACCESS_COOKIE_NAME, payload.accessToken, accessCookieOpts(this.configService.get<string>('NODE_ENV')));
      reply.setCookie(REFRESH_COOKIE_NAME, payload.refreshToken, refreshCookieOpts(this.configService.get<string>('NODE_ENV')));
    }

    return payload;
  }

  /**
   * POST /auth/logout — revokes the current access token (adds jti to blacklist).
   * Accepts the token from the `access_token` cookie OR the `Authorization`
   * header (cookie wins if both are present).
   * @param user - injected from JWT via @CurrentUser()
   * @param req - FastifyRequest; the raw Bearer token is parsed from headers or cookies
   * @param reply - FastifyReply (passthrough) used to clear cookies
   * @returns { message: 'Successfully logged out' }
   * @throws InternalServerErrorException if the blacklist write fails
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
    const command: LogoutCommand = { token, userId: user.id };
    const result = await this.logoutHandler.execute(command);
    assertOk(result);

    // Clear both cookies regardless of which one was used.
    // Path must match how the cookie was originally set, otherwise the
    // browser won't actually delete it.
    if (typeof reply.clearCookie === 'function') {
      reply.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    }

    return { message: 'Successfully logged out' };
  }

  /**
   * PATCH /auth/change-password — change the current user's password.
   * @param user - injected from JWT via @CurrentUser()
   * @param dto - ChangePasswordDto with oldPassword + newPassword
   * @returns { message: 'Password changed successfully' }
   * @throws BadRequestException when the old password is wrong or new password fails complexity
   * @throws NotFoundException when the userId no longer exists
   */
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Parolni o'zgartirish" })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    const validated = ChangePasswordSchema.parse(dto);
    const command: ChangePasswordCommand = {
      userId:      user.id,
      oldPassword: validated.oldPassword,
      newPassword: validated.newPassword,
    };
    const result = await this.changePasswordHandler.execute(command);
    assertOk(result);
    return { message: 'Password changed successfully' };
  }

  @Post('verify-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP kodni tasdiqlash' })
  async verifyOtp(@Body() body: { code: string; sessionId: string }) {
    const validated = VerifyOtpSchema.parse(body);
    const command: VerifyOtpCommand = { code: validated.code, sessionId: validated.sessionId };
    const result = await this.verifyOtpHandler.execute(command);
    return unwrapOrThrow(result);
  }

  @Post('resend-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP kodni qayta yuborish' })
  async resendOtp(@Req() req: FastifyRequest) {
    const command: ResendOtpCommand = { ipAddress: (req.ip as string) || 'unknown' };
    const result = await this.resendOtpHandler.execute(command);
    return unwrapOrThrow(result);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Joriy foydalanuvchi ma'lumotlari" })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  /**
   * POST /auth/refresh — exchange a valid refresh token for a fresh access token
   * AND a fresh refresh token (rotation). The OLD refresh token is blacklisted
   * the moment a new pair is issued, so even if an attacker has captured the
   * old token they can use it at most once before the victim's next refresh
   * invalidates their session — a classic detection signal.
   *
   * Uses JWT_REFRESH_SECRET (NOT JWT_SECRET) to verify, so an exfiltrated
   * access token cannot be replayed here.
   *
   * Accepts the refresh token from `refresh_token` cookie OR
   * `Authorization: Bearer <refreshToken>` header (cookie wins if both set).
   *
   * @param auth - the `Authorization: Bearer <refreshToken>` header (fallback)
   * @param req - FastifyRequest, used to read the refresh_token cookie
   * @param reply - FastifyReply (passthrough), used to set the new cookies
   * @returns { accessToken, refreshToken } — both rotated
   * @throws UnauthorizedException for missing, malformed, expired, or revoked refresh tokens
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

      // Reject replays: blacklisted tokens must not mint new pairs.
      const isBlacklisted = await this.authRepo.isTokenBlacklisted(oldRefreshToken);
      if (isBlacklisted) throw new UnauthorizedException(await this.i18n.t('auth.tokenRevoked'));

      // Issue NEW access token (same lifetime / claims as login).
      const accessToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username, role: payload.role },
        { expiresIn: this.configService.get('JWT_EXPIRES_IN') ?? '24h' },
      );

      // Issue NEW refresh token — signed with JWT_REFRESH_SECRET, longer lifetime.
      const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
      const refreshToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username, role: payload.role },
        { secret: refreshSecret, expiresIn: refreshExpiresIn },
      );

      // Blacklist the OLD refresh token AFTER successfully minting the new pair,
      // so a transient DB error doesn't leave the user locked out. expiresAt is
      // computed from the old payload's exp claim (seconds since epoch).
      const oldExpiresAt = typeof payload.exp === 'number'
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_SEC * 1000);
      await this.authRepo.blacklistToken(oldRefreshToken, oldExpiresAt);

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

  @Get('health')
  @Public()
  @SkipThrottle()
  @ApiOperation({ summary: 'Auth xizmati holati (no auth, no throttle — for health checks + load tests)' })
  health() {
    return {
      status: 'ok',
      service: 'auth',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
