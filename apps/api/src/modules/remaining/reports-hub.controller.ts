/**
 * @module reports-hub.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ReportsHubService } from './reports-hub.service';
import { CompatBodyDto } from '../compatibility/dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const REPORT_ROLES = ['manager', 'finance', 'admin', 'super_admin', 'director', 'MANAGER', 'ADMIN', 'SUPER_ADMIN', 'DIRECTOR'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('reports-hub')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...REPORT_ROLES)
export class ReportsHubController {
  constructor(private readonly svc: ReportsHubService) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.svc.getDashboard());
  }

  @Get('categories')
  async getCategories() {
    return unwrapOrInternal(await this.svc.getCategories());
  }

  @Get('definitions')
  async getDefinitions(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getDefinitions(q));
  }

  @Post('definitions')
  @HttpCode(HttpStatus.CREATED)
  async createDefinition(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createDefinition(body));
  }

  @Get('runs')
  async getRuns(@Query() q: Record<string, string>) {
    return unwrapOrInternal(await this.svc.getRuns(q));
  }

  @Get('runs/:runId')
  async getRun(@Param('runId') runId: string) {
    return unwrapOrInternal(await this.svc.getRun(runId));
  }

  @Post('generate/:definitionId')
  @HttpCode(HttpStatus.CREATED)
  async generateReport(
    @Param('definitionId') definitionId: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.generateReport(definitionId, user.id));
  }

  @Post('seed-categories')
  async seedCategories() {
    return unwrapOrInternal(await this.svc.seedCategories());
  }

  @Get('subscriptions')
  async getSubscriptions(@CurrentUser() user: { id: number; role: string }) {
    return unwrapOrInternal(await this.svc.getSubscriptions(user.id));
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @Body() body: CompatBodyDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.createSubscription(body, user.id));
  }

  @Delete('subscriptions/:id')
  async deleteSubscription(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.deleteSubscription(id, user.id));
  }
}
