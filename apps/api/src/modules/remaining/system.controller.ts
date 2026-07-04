/**
 * @module system.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemService } from './system.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  CronJobAclTranslator,
  type LegacyCronJobRow,
  type CronJobDto,
} from './acl/cron-job-acl';
import { MaterializedViewRefreshService, MATERIALIZED_VIEWS } from '../queue/materialized-view-refresh.service';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(RolesGuard)
@Controller('system')
@Roles('admin', 'super_admin', 'director')
export class SystemController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly cronAcl = new CronJobAclTranslator();

  constructor(private readonly svc: SystemService) {}

  // POST /system endpoint removed — no frontend consumer, no service backing.

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

  /**
   * PA2-14 ACL-translated variant. New BC-10 (Platform / Ops) consumers
   * should target this endpoint; the legacy `/cron-jobs` route stays for
   * backwards-compat.
   */
  @Get('cron-jobs/v2')
  getCronJobsV2(): CronJobDto[] {
    const r = this.svc.getCronJobs();
    assertOk(r);
    const rows = Array.isArray(r.data) ? r.data : [];
    return rows
      .map((row) => this.cronAcl.toDomain(row as unknown as LegacyCronJobRow))
      .filter((res): res is { ok: true; data: CronJobDto } => res.ok)
      .map((res) => res.data);
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
  constructor(private readonly mvRefresh: MaterializedViewRefreshService) {}

  /**
   * Q23 fix: bu avval hech qanday server-amal bajarmasdan
   * { ok: true } qaytarardi (Q-40 soxta-muvaffaqiyat). Endi supply-chain'ga
   * tegishli materialized view'larni (mv_inventory_daily va h.k.) haqiqatan
   * REFRESH qiladi — xuddi shu servis 15 daqiqada bir marta cron orqali
   * ham ishga tushadi (materialized-view-refresh.service.ts).
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh() {
    const results = await Promise.all(
      MATERIALIZED_VIEWS.map((v) => this.mvRefresh.refreshView(v)),
    );
    const failures = results.filter((r) => !r.ok);
    return {
      ok: failures.length === 0,
      refreshedAt: new Date().toISOString(),
      views: MATERIALIZED_VIEWS,
      failedViews: failures.length,
    };
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
