/**
 * @module director-root.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, InternalServerErrorException, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { GetDashboardKpisQuery } from '../application/queries/get-dashboard-kpis.query';
import { DirectorDataService } from '../application/director-data.service';
import { OwnerSummaryService } from '../application/owner-summary.service';

@ApiTags('Director — Root Aliases')
@ApiBearerAuth()
@ApiThrottle()
@Controller('director')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class DirectorRootController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly directorData: DirectorDataService,
    private readonly ownerSummary: OwnerSummaryService,
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

  // VISION-3340 #12: DirSummary endilikda `ckpDeadlineCompliance` maydonini ham
  // o'z ichiga oladi (bugungi ЦКП deadline-gate muvofiqlik foizi — ckp-gate.ts
  // qoidasi bilan; hisoblash director-data.service.ts da).
  @Get('summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Director summary — DirSummary shape (+ ЦКП deadline-gate compliance rate)' })
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

  // T21-B1 #27/#28: owner daily digest — holat + 5 owner numbers (new/lost/small
  // customers + sales-trend + top-risk), computed from live SD/CRM. GET = compute only.
  @Get('owner-summary')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Owner daily digest — holat + 5 owner numbers (compute only)' })
  async getOwnerSummary() {
    return unwrapOrInternal(await this.ownerSummary.buildSummary(false));
  }

  // POST = compute + config-gated Telegram push (graceful when not configured).
  @Post('owner-summary/send')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR)
  @ApiOperation({ summary: 'Owner daily digest — compute + Telegram send (config-gated)' })
  async sendOwnerSummary() {
    return unwrapOrInternal(await this.ownerSummary.buildSummary(true));
  }
}
