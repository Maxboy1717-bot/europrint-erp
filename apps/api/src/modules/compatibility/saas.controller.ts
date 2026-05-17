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

// P3-26: tenant-modules / orders-registry stubs not yet wired.
const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrBadRequest, unwrapOrInternal, unwrapOrNotFound } from '@common/http-result';
import { z } from 'zod';
import { SaasService } from './saas.service';
import { DEFAULT_PAGE_SIZE } from '@common/constants/app.constants';
import {
  SaasTenantAclTranslator,
  type LegacySaasTenantRow,
  type SaasTenantDto,
} from './acl/saas-tenant-acl';

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

@ApiTags('SAAS')
@ApiBearerAuth()
@Roles('super_admin', 'admin')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('saas')
export class SaasController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly tenantAcl = new SaasTenantAclTranslator();

  constructor(private readonly svc: SaasService) {}

  @Get('tenants')
  async getTenants() {
    return unwrapOrInternal(await this.svc.getTenants());
  }

  /**
   * PA2-14 ACL-translated variant. New BC-10 (Platform / SaaS) consumers
   * should target this endpoint; the legacy `/tenants` route stays for
   * backwards-compat with the existing admin dashboard.
   */
  @Get('tenants/v2')
  async getTenantsV2(): Promise<SaasTenantDto[]> {
    const raw = unwrapOrInternal(await this.svc.getTenants()) as unknown as LegacySaasTenantRow[];
    const list = Array.isArray(raw) ? raw : [];
    return list
      .map((row) => this.tenantAcl.toDomain(row))
      .filter((r): r is { ok: true; data: SaasTenantDto } => r.ok)
      .map((r) => r.data);
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
  async getTenantModules(@Param('id') _id: string) {
    return notImplemented('GET /saas/tenants/:id/modules');
  }

  @Patch('tenants/:id/modules')
  async updateTenantModules(@Param('id') _id: string, @Body() body: unknown) {
    UpdateTenantModulesSchema.parse(body);
    return notImplemented('PATCH /saas/tenants/:id/modules');
  }

  @Post('tenants/:id/onboard')
  async onboardTenant(@Param('id') _id: string, @Body() body: unknown) {
    OnboardTenantSchema.parse(body ?? {});
    return notImplemented('POST /saas/tenants/:id/onboard');
  }
}

@ApiThrottle()
@Controller('orders-registry')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class OrdersRegistryCompatController {
  @Get()
  @Roles('admin', 'super_admin', 'manager', 'director', 'accountant', 'sales')
  async listOrders() {
    return notImplemented('GET /orders-registry');
  }

  @Post()
  @Roles('admin', 'super_admin', 'manager', 'director', 'accountant', 'sales')
  async createOrder(@Body() _body: unknown) {
    return notImplemented('POST /orders-registry');
  }
}
