/**
 * @module admin-auth.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertInternal } from '@common/assertions';
import {
  Controller,
  Post,
  Body,
  Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/decorators/public.decorator';
import { LegacyService } from '../services/legacy.service';
import { LegacyRefreshTokenSchema, LegacyRefreshTokenDto } from '../dto/legacy.dto';

@ApiTags('Admin Auth (Legacy)')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller()
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(
    private readonly legacyService: LegacyService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('auth/refresh')
  @UsePipes(new ZodValidationPipe(LegacyRefreshTokenSchema))
  async refreshToken(@Body() body: LegacyRefreshTokenDto) {
    // getOrThrow: fail loudly if JWT_REFRESH_SECRET is missing — never fall back to JWT_SECRET
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const decoded = this.jwtService.verify(body.refreshToken, { secret: refreshSecret }) as Record<string, unknown>;
    const admin = await this.legacyService.findAdminById(decoded['id'] as string | number);
    assertInternal(admin, 'Admin topilmadi');

    const accessToken = this.jwtService.sign(
      {
        id:       admin['id'],
        username: String(admin['username'] ?? ''),
        role:     String(admin['role'] ?? 'admin'),
        name:     String(admin['name'] ?? admin['username'] ?? ''),
      },
      { expiresIn: '24h' },
    );
    return { accessToken };
  }
}
