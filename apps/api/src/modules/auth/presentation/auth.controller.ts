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
import { BadRequestException, Body, Controller, Get, Headers, HttpCode, HttpStatus, Inject, Patch, Post, Req, Logger, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { LoginHandler, LoginCommand } from '../application/commands/login.handler';
import { LogoutHandler, LogoutCommand } from '../application/commands/logout.handler';
import { ChangePasswordHandler, ChangePasswordCommand } from '../application/commands/change-password.handler';
import { VerifyOtpHandler, VerifyOtpCommand } from '../application/commands/verify-otp.handler';
import { ResendOtpHandler, ResendOtpCommand } from '../application/commands/resend-otp.handler';
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

@Throttle({ default: { limit: 5, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly loginHandler: LoginHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly changePasswordHandler: ChangePasswordHandler,
    private readonly verifyOtpHandler: VerifyOtpHandler,
    private readonly resendOtpHandler: ResendOtpHandler,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(AUTH_REPO) private readonly authRepo: IAuthRepo,
  ) {}

  /**
   * POST /auth/login — exchange username/password for access + refresh tokens.
   * @param dto - LoginDto, validated against LoginSchema (Zod)
   * @param req - FastifyRequest, used for IP/User-Agent audit logging
   * @returns { accessToken, refreshToken, user }
   * @throws UnauthorizedException on bad credentials, locked, or inactive account
   * @throws BadRequestException on schema-validation failure (Zod)
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimga kirish' })
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    const validated = LoginSchema.parse(dto);
    const command: LoginCommand = {
      username:  validated.username,
      password:  validated.password,
      ipAddress: (req.ip as string) || 'unknown',
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
    };
    const result = await this.loginHandler.execute(command);
    return unwrapOrThrow(result);
  }

  /**
   * POST /auth/logout — revokes the current access token (adds jti to blacklist).
   * @param user - injected from JWT via @CurrentUser()
   * @param req - FastifyRequest; the raw Bearer token is parsed from headers
   * @returns { message: 'Successfully logged out' }
   * @throws InternalServerErrorException if the blacklist write fails
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tizimdan chiqish' })
  async logout(@CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    const authHeader = req.headers['authorization'] as string;
    const token = authHeader?.replace('Bearer ', '') || '';
    const command: LogoutCommand = { token, userId: user.id };
    const result = await this.logoutHandler.execute(command);
    assertOk(result);
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
   * POST /auth/refresh — exchange a valid refresh token for a fresh access token.
   * Uses JWT_REFRESH_SECRET (NOT JWT_SECRET) to verify, so an exfiltrated access
   * token cannot be used here. Blacklist is checked before re-signing.
   * @param auth - the `Authorization: Bearer <refreshToken>` header
   * @returns { accessToken }
   * @throws UnauthorizedException for missing, malformed, expired, or revoked refresh tokens
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'JWT tokenni yangilash (refresh)' })
  async refresh(@Headers('authorization') auth: string) {
    const token = auth?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Token required');

    try {
      // getOrThrow: fail loudly if JWT_REFRESH_SECRET is missing — never fall back to JWT_SECRET
      const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify(token, { secret: refreshSecret });
      const isBlacklisted = await this.authRepo.isTokenBlacklisted(token);
      if (isBlacklisted) throw new UnauthorizedException('Token revoked');

      const accessToken = this.jwtService.sign(
        { sub: payload.sub, username: payload.username, role: payload.role },
        { expiresIn: this.configService.get('JWT_EXPIRES_IN') ?? '24h' },
      );
      return { accessToken };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Token muddati tugagan');
    }
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Auth xizmati holati' })
  health() {
    return { status: 'ok', service: 'auth' };
  }
}
