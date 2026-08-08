/**
 * @module saas.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   saas module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import {
  Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post, Put,
  UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest, unwrapOrInternal, unwrapOrNotFound } from '@common/http-result';
import { z } from 'zod';
import { SaasService } from './saas.service';
import { OrdersRegistryService } from './orders-registry.service';
import { DEFAULT_PAGE_SIZE } from '@common/constants/app.constants';

const CreateTenantSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  employeeLimit: z.number().int().min(1).default(50),
});

const UpdateTenantStatusSchema = z.object({ status: z.enum(['active', 'suspended', 'trial', 'inactive']) });

const UpdateTenantModulesSchema = z.object({
  modules: z.array(z.string()).optional(),
}).passthrough();

const OnboardTenantSchema = z.object({
  adminEmail: z.string().email().optional(),
  modules: z.array(z.string()).optional(),
}).passthrough();

const OrderRegistrySchema = z.object({
  number: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  issuedBy: z.union([z.string(), z.number()]).optional(),
  issuedDate: z.string().optional(),
  status: z.string().max(50).optional(),
  departmentIds: z.array(z.union([z.string(), z.number()])).optional(),
}).passthrough();

@ApiTags('SAAS')
@ApiBearerAuth()
@Roles('super_admin', 'admin')
@ApiThrottle()
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
  async getTenantModules(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getTenantModules(id));
  }

  @Patch('tenants/:id/modules')
  async updateTenantModules(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateTenantModulesSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateTenantModules(id, Array.isArray(dto.modules) ? dto.modules : []));
  }

  @Post('tenants/:id/onboard')
  async onboardTenant(@Param('id') id: string, @Body() body: unknown) {
    const dto = OnboardTenantSchema.parse(body ?? {});
    return unwrapOrInternal(await this.svc.onboardTenant(id, { adminEmail: dto.adminEmail, modules: dto.modules }));
  }
}

@ApiThrottle()
@Controller('orders-registry')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class OrdersRegistryCompatController {
  constructor(private readonly svc: OrdersRegistryService) {}

  @Get()
  @Roles('admin', 'super_admin', 'manager', 'director', 'accountant', 'sales')
  async listOrders() {
    return unwrapOrInternal(await this.svc.listOrders());
  }

  @Post()
  @Roles('admin', 'super_admin', 'manager', 'director', 'accountant', 'sales')
  async createOrder(@Body() body: unknown) {
    const dto = OrderRegistrySchema.parse(body);
    return unwrapOrInternal(await this.svc.createOrder({
      number: dto.number,
      category: dto.category,
      title: dto.title,
      content: dto.content,
      issuedBy: dto.issuedBy != null ? String(dto.issuedBy) : undefined,
      issuedDate: dto.issuedDate,
      status: dto.status,
      departmentIds: dto.departmentIds,
    }));
  }
}
