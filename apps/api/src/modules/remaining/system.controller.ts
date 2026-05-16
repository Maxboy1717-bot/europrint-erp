/**
 * @module system.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemService } from './system.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Controller('system')
@Roles('admin', 'super_admin', 'director')
export class SystemController {
  constructor(private readonly svc: SystemService) {}

  // P3-26: there is no real create-system endpoint yet — the SystemService
  // exposes only read-only health/stats. Return 501 instead of fake success.
  @Post()
  async create() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: POST /system', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Get('health')
  async getHealth() {
    return unwrapOrThrow(await this.svc.getHealth());
  }

  @Get('db-stats')
  async getDbStats() {
    return unwrapOrThrow(await this.svc.getDbStats());
  }

  @Get('cron-jobs')
  getCronJobs() {
    const r = this.svc.getCronJobs();
    assertOk(r);
    return r.data;
  }

  @Get()
  getSystemInfo() { return { status: 'ok', version: '1.0.0' }; }

  @Get('integrations')
  getIntegrations() {
    const r = this.svc.getIntegrations();
    assertOk(r);
    return r.data;
  }
}

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Controller('supply-chain')
@Roles('admin', 'super_admin', 'director', 'purchaser', 'purchase_manager')
export class SupplyChainController {
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh() {
    // Cache invalidation trigger — clients re-fetch after calling this
    return { ok: true, refreshedAt: new Date().toISOString() };
  }
}

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Controller('system/settings')
@Roles('admin', 'super_admin', 'director')
export class SystemSettingsController {
  constructor(private readonly svc: SystemService) {}

  @Get()
  async getSettings() {
    return unwrapOrThrow(await this.svc.getSettings());
  }

  @Put()
  async updateSettings(@Body() body: CompatBodyDto) {
    return unwrapOrThrow(await this.svc.updateSettings(body));
  }
}
