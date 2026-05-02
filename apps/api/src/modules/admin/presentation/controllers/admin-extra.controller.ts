import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';
import { UserRole } from '../../domain/aggregates/user.aggregate';
import { AdminExtraService } from '../../application/services/admin-extra.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Admin — Extra')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
@Controller('admin')
export class AdminExtraController {
  constructor(private readonly svc: AdminExtraService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Tizim rollari ro`yxati' })
  getRoles() {
    return { roles: this.svc.getRoles() };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Tizim audit loglari' })
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getLogs(Number(page), Number(limit)));
  }

  @Get('audit')
  @ApiOperation({ summary: 'Audit yozuvlari' })
  async getAudit(@Query('table') tableName?: string, @Query('page') page?: string) {
    return unwrapOrInternal(await this.svc.getAudit(tableName, Number(page)));
  }

  @Get('system')
  @ApiOperation({ summary: 'Tizim holati va ogohlantirishlari' })
  async getSystemStatus() {
    return unwrapOrInternal(await this.svc.getSystemStatus());
  }

  @Get('system/alerts/:id')
  @ApiOperation({ summary: 'Tizim ogohlantirishi' })
  async getAlert(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getAlertById(id));
  }

  @Post('login')
  @ApiOperation({ summary: 'Admin login (compatibility stub)' })
  async adminLogin(@Body() _body: unknown) {
    return { message: 'Use /api/auth/login for authentication', data: null };
  }
}
