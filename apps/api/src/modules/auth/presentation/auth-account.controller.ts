/**
 * @module auth-account.controller
 * @description Account/profile endpoints (change-password, verify-otp, resend-otp,
 * me, health). Split from auth.controller.ts per Rule 16 (≤ 300 lines).
 * Shares the `/auth` prefix and same throttle/interceptor decorators with the
 * session controller so consumers see no route change.
 */

import { assertOk, unwrapOrThrow } from '@common/http-result';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseInterceptors } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { ChangePasswordService, ChangePasswordCommand } from '../application/services/change-password.service';
import { VerifyOtpService, VerifyOtpCommand } from '../application/services/verify-otp.service';
import { ResendOtpService, ResendOtpCommand } from '../application/services/resend-otp.service';
import { ChangePasswordDto, ChangePasswordSchema } from './dto/change-password.dto';
import { VerifyOtpSchema } from './dto/otp.dto';
import { CurrentUser } from '../infrastructure/decorators/current-user.decorator';
import { Public } from '../infrastructure/decorators/public.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { AuthenticatedUser } from '../domain/types';

@AuthThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('auth')
@ApiTags('Auth')
export class AuthAccountController {
  constructor(
    private readonly changePasswordHandler: ChangePasswordService,
    private readonly verifyOtpHandler: VerifyOtpService,
    private readonly resendOtpHandler: ResendOtpService,
  ) {}

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
