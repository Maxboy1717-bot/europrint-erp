import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { assertInternal } from '@common/assertions';
import {
  Controller,
  Post,
  Body,
  Logger, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    private readonly db: LegacyService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('auth/refresh')
  @UsePipes(new ZodValidationPipe(LegacyRefreshTokenSchema))
  async refreshToken(@Body() body: LegacyRefreshTokenDto) {
    const decoded = this.jwtService.verify(body.refreshToken) as Record<string, unknown>;
    const admin = await this.db.findAdminById(decoded['id'] as string | number);
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
