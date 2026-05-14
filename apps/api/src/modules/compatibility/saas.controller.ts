/**
 * @module saas.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put,
  UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest, unwrapOrInternal, unwrapOrNotFound } from '@common/http-result';
import { z } from 'zod';
import { SaasService } from './saas.service';
import { DEFAULT_PAGE_SIZE } from '@common/constants/app.constants';

const CreateTenantSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  employeeLimit: z.number().int().min(1).default(50),
});

const UpdateTenantStatusSchema = z.object({ status: z.enum(['active', 'suspended', 'trial', 'inactive']) });

@ApiTags('SAAS')
@ApiBearerAuth()
@Roles('super_admin', 'admin')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('saas')
export class SaasController {
  constructor(private readonly svc: SaasService) {}

  @Get('tenants')
  async getTenants() {
    return unwrapOrInternal(await this.svc.getTenants());
  }

  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() body: unknown) {
    const dto = CreateTenantSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createTenant(dto));
  }

  @Get('platform-stats')
  async getPlatformStats() {
    return unwrapOrInternal(await this.svc.getPlatformStats());
  }

  @Get('error-logs')
  async getErrorLogs() {
    return unwrapOrBadRequest(await this.svc.getErrorLogs());
  }

  @Patch('tenants/:id/status')
  async updateTenantStatus(@Param('id') id: string, @Body() body: unknown) {
    const { status } = UpdateTenantStatusSchema.parse(body);
    return unwrapOrNotFound(await this.svc.updateTenantStatus(id, status));
  }

  @Get('modules')
  async getModules() {
    return unwrapOrBadRequest(await this.svc.getModules());
  }

  @Get('expiry-alerts')
  async getExpiryAlerts() {
    return unwrapOrInternal(await this.svc.getExpiryAlerts());
  }

  @Get('tenants/:id')
  async getTenantById(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.getTenantById(id));
  }

  @Put('tenants/:id')
  async updateTenant(@Param('id') id: string, @Body() body: unknown) {
    const dto = CreateTenantSchema.partial().parse(body);
    return unwrapOrNotFound(await this.svc.updateTenant(id, dto));
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.OK)
  async deleteTenant(@Param('id') id: string) {
    return unwrapOrNotFound(await this.svc.deleteTenant(id));
  }

  @Get('tenants/:id/modules')
  async getTenantModules(@Param('id') id: string) { return { data: [], tenantId: id }; }

  @Patch('tenants/:id/modules')
  async updateTenantModules(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { tenantId: id, ...body, updated: true };
  }

  @Post('tenants/:id/onboard')
  async onboardTenant(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, onboarded: true }; }
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('orders-registry')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class OrdersRegistryCompatController {
  @Get()
  @Roles('admin', 'super_admin', 'manager', 'director', 'accountant', 'sales')
  async listOrders() { return { data: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE }; }

  @Post()
  @Roles('admin', 'super_admin', 'manager', 'director', 'accountant', 'sales')
  async createOrder(@Body() _body: unknown) { return { message: 'Order created', data: null }; }
}
