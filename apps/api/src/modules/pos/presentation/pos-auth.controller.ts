/**
 * POS — Auth Controller
 * ERP-independent POS authentication and role-validation endpoints.
 * All credential/token logic is delegated to PosAuthService.
 */
import {
  Controller, Post, Get, Body, UseGuards, UseInterceptors, HttpCode, HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthThrottle } from '@common/decorators/throttle-profiles';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { PosAuthService } from '../application/services/pos-auth.service';
import { PosLoginDto } from '../dto/pos.dto';

const POS_ALLOWED_ROLES = new Set([
  'pos', 'pos_manager', 'warehouse_manager', 'warehouse_staff',
  'warehouse_viewer', 'qc_inspector', 'finance_head', 'admin', 'super_admin',
]);

@ApiTags('POS — Auth')
@UseInterceptors(AuditInterceptor)
@Controller('pos/auth')
export class PosAuthController {
  constructor(private readonly posAuthService: PosAuthService) {}

  /**
   * Dedicated POS login — ERP-independent.
   * Rate-limited to 5 attempts / 60 s to prevent brute-force.
   * Returns { token, userId, role, username } directly; no separate validate call needed.
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @AuthThrottle() // 5 req/min — slows credential stuffing
  @ApiOperation({ summary: 'POS-specific login (ERP-independent, rate-limited)' })
  async login(@Body() dto: PosLoginDto): Promise<{
    token: string; userId: number; role: string; username: string;
  }> {
    const result = await this.posAuthService.login(dto.username, dto.password);
    if (!result.ok) {
      throw new UnauthorizedException(result.error);
    }
    return result.data;
  }

  /**
   * Validate POS access for a JWT holder.
   * Returns { valid: false } for non-POS roles instead of 403,
   * so frontend can gate entry without catching errors.
   */
  @Post('validate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'POS Monitor access role check' })
  validate(@CurrentUser() user: AuthenticatedUser): {
    valid: boolean; userId: number; role: string; username: string;
  } {
    const role = (user.role ?? '').toLowerCase();
    const valid = POS_ALLOWED_ROLES.has(role) || role.startsWith('pos');
    return { valid, userId: user.id, role: user.role, username: user.username };
  }

  /** Health-check for POS auth namespace — public. */
  @Get('ping')
  @Public()
  @ApiOperation({ summary: 'POS auth namespace liveness probe' })
  ping(): { status: string; service: string; ts: string } {
    return { status: 'ok', service: 'pos-auth', ts: new Date().toISOString() };
  }
}
