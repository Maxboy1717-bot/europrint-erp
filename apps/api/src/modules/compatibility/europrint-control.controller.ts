/**
 * @module europrint-control.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, UseGuards, Get, Query, Param , UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { EuroprintControlCompatService } from './europrint-control.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('EuroPrint Control Center (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('europrint-control')
export class EuroprintControlCompatController {
  constructor(private readonly svc: EuroprintControlCompatService) {}

  @Get('business-rules')
  async getBusinessRules() {
    return unwrapOrInternal(await this.svc.getBusinessRules());
  }

  @Get('units')
  async getUnits() {
    return unwrapOrInternal(await this.svc.getUnits());
  }

  @Get('validation-rules')
  async getValidationRules() {
    return unwrapOrInternal(await this.svc.getValidationRules());
  }

  @Get('kpis')
  async getKpis() {
    return unwrapOrInternal(await this.svc.getKpis());
  }

  @Get('auditor-dashboard')
  async getAuditorDashboard() {
    return unwrapOrInternal(await this.svc.getAuditorDashboard());
  }

  @Get('sap-patterns-summary')
  async getSapPatternsSummary() {
    return unwrapOrInternal(await this.svc.getSapPatternsSummary());
  }

  @Get('all-rules-summary')
  async getAllRulesSummary() {
    return unwrapOrInternal(await this.svc.getAllRulesSummary());
  }

  @Get('logs')
  async getLogs(
    @Query('entityType') entityType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getLogs(entityType, fromDate, limit));
  }

  @Get('logs/:id')
  async getLogById(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getLogById(id));
  }

  @Get('module-health')
  async getModuleHealth() {
    return unwrapOrInternal(await this.svc.getModuleHealth());
  }

  @Get('validation-summary')
  async getValidationSummary() {
    return unwrapOrInternal(await this.svc.getValidationSummary());
  }

  @Get('validation-results')
  async getValidationResults(@Query('ruleId') ruleId?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getValidationResults(ruleId, limit));
  }

  @Get('audit-stats')
  async getAuditStats(@Query('period') period?: string) {
    return unwrapOrInternal(await this.svc.getAuditStats(period));
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.svc.getAuditLogs(action, userId, limit));
  }

  @Get('action-types')
  async getActionTypes() {
    return unwrapOrInternal(await this.svc.getActionTypes());
  }

  @Get('source-types')
  async getSourceTypes() {
    return unwrapOrInternal(await this.svc.getSourceTypes());
  }

  @Get('menus')
  async getMenus(@Query('role') role?: string) {
    return unwrapOrInternal(await this.svc.getMenus(role));
  }

  @Get('menus/:role')
  async getMenusByRole(@Param('role') role: string) {
    return unwrapOrInternal(await this.svc.getMenus(role));
  }

  @Get('audit-action-types')
  async getAuditActionTypes() {
    return unwrapOrInternal(await this.svc.getActionTypes());
  }

  @Get('audit-source-types')
  async getAuditSourceTypes() {
    return unwrapOrInternal(await this.svc.getSourceTypes());
  }
}
