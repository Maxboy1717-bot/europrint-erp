import { assertOk, unwrapOrThrow } from '@common/http-result';
import { assertAuth } from '@common/assertions';
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Logger, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  ) {}

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

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'JWT tokenni yangilash (refresh)' })
  async refresh(@Req() req: FastifyRequest) {
    const authHeader = req.headers['authorization'] as string;
    const token = authHeader?.replace('Bearer ', '');
    assertAuth(token, 'Token required');
    throw new UnauthorizedException('Token expired or invalid — please login again');
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Auth xizmati holati' })
  health() {
    return { status: 'ok', service: 'auth' };
  }
}
