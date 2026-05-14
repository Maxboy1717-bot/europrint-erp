/**
 * @module production-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound } from '@common/assertions';
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ProductionService } from './production.service';
import { safeInt } from '../hr/common/db-rows';

import { MS_PER_DAY } from '@common/constants/app.constants';
const PROD_ROLES = ['super_admin', 'director', 'production_manager', 'operator', 'technologist'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('production')
@UseGuards(RolesGuard)
@Roles(...PROD_ROLES)
export class ProductionReportsController {
  private readonly logger = new Logger(ProductionReportsController.name);

  constructor(private readonly svc: ProductionService) {}

  @Get('reports/weekly')
  async weeklyReport(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const s = start || new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
    const e = end || _time.now().toISOString();
    return unwrapOrThrow(await this.svc.weeklyReport(s, e));
  }

  @Get('stats')
  async stats() {
    return unwrapOrThrow(await this.svc.getProductionStats());
  }

  @Get('orders/:id/360-card')
  async order360Card(@Param('id') id: string) {
    const r = await this.svc.getOrder360Card(safeInt(id, 0));
    assertFound(r, 'Production order not found');
    return r;
  }

  @Get('orders')
  async getOrders() { return { data: [], total: 0 }; }
}
