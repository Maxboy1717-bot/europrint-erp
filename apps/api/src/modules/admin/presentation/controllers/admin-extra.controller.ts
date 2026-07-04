/**
 * @module admin-extra.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Param, ParseIntPipe, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';
import { UserRole } from '../../domain/aggregates/user.aggregate';
import { AdminExtraService } from '../../application/services/admin-extra.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Admin — Extra')
@ApiBearerAuth()
@ApiThrottle()
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
    return unwrapOrInternal(await this.svc.getLogs(Number(page) || 1, Number(limit) || 20));
  }

  @Get('audit')
  @ApiOperation({ summary: 'Audit yozuvlari' })
  async getAudit(@Query('table') tableName?: string, @Query('page') page?: string) {
    return unwrapOrInternal(await this.svc.getAudit(tableName, Number(page) || 1));
  }

  @Get('audit-filtered')
  @ApiOperation({ summary: 'Filtrli audit loglari (super admin)' })
  async getAuditFiltered(
    @Query('action') action?: string,
    @Query('table') tableName?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getLogsFiltered({
      action, tableName, userId, search, from, to,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    }));
  }

  @Get('audit-tables')
  @ApiOperation({ summary: 'Audit logdagi jadval nomlari (filter uchun)' })
  async getAuditTables() {
    return unwrapOrInternal(await this.svc.getDistinctTables());
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
}
