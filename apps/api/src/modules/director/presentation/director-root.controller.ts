/**
 * @module director-root.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, InternalServerErrorException, UseGuards, UseInterceptors } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { GetDashboardKpisQuery } from '../application/queries/get-dashboard-kpis.query';
import { DirectorDataService } from '../application/director-data.service';

@ApiTags('Director — Root Aliases')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('director')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DirectorRootController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly directorData: DirectorDataService,
  ) {}

  @Get('kpi')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director KPI (legacy alias)' })
  async getKpi() {
    const res = await this.queryBus.execute(new GetDashboardKpisQuery());
    return unwrapOrThrow(res);
  }

  @Get('kpis')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director KPIs (plural alias)' })
  async getKpis() {
    const res = await this.queryBus.execute(new GetDashboardKpisQuery());
    return unwrapOrThrow(res);
  }

  @Get('summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director summary — DirSummary shape' })
  async getSummary() {
    return unwrapOrInternal(await this.directorData.getSummaryFull());
  }

  @Get('production')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PRODUCTION_MANAGER)
  @ApiOperation({ summary: 'Director production — ProductionData shape' })
  async getProduction() {
    return unwrapOrInternal(await this.directorData.getProductionFull());
  }

  @Get('hr')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Director HR — HRData shape' })
  async getHr() {
    return unwrapOrInternal(await this.directorData.getHrFull());
  }

  @Get('finance')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Director finance — FinanceData shape' })
  async getFinance() {
    return unwrapOrInternal(await this.directorData.getFinanceFull());
  }

  @Get('alerts')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director alerts' })
  async getAlerts() {
    return unwrapOrInternal(await this.directorData.getAlerts());
  }

  @Get('ai-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director AI summary' })
  async getAiSummary() {
    return unwrapOrInternal(await this.directorData.getAiSummary());
  }
}
