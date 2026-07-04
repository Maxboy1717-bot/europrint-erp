/**
 * @module resources.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   resources module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Patch, Delete, Body, Query, Param, HttpCode, HttpStatus, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ResourcesCompatService } from './resources.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { WarehouseCreateDto, WarehouseUpdateDto } from './dto/warehouse.dto';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('Warehouses (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('warehouses')
export class WarehousesCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getWarehouses(page, limit));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getWarehouse(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: WarehouseCreateDto) {
    return unwrapOrInternal(await this.svc.createWarehouse(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: WarehouseUpdateDto) {
    return unwrapOrInternal(await this.svc.updateWarehouse(id, body));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteWarehouse(id));
  }

  @Post('notify-vacancies')
  @HttpCode(HttpStatus.OK)
  async notifyVacancies(@Body() _body: unknown) {
    return { notified: false, reason: 'notification service not configured' };
  }
}

@ApiTags('Material Cards (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director', 'warehouse_manager', 'warehouse_keeper')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('material-cards')
export class MaterialCardsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterialCards(page, limit, search));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getMaterialCard(id));
  }

  @Post()
  @UseInterceptors(AuditInterceptor)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createMaterialCard(body));
  }

  @Patch(':id/unit-price')
  @UseInterceptors(AuditInterceptor)
  async updateUnitPrice(@Param('id') id: string, @Body() body: { unit_price: unknown }) {
    const price = Number(body?.unit_price);
    if (!Number.isFinite(price) || price < 0) throw new BadRequestException('unit_price must be a non-negative number');
    return unwrapOrInternal(await this.svc.updateMaterialCardUnitPrice(id, price));
  }
}

@ApiTags('Org Departments (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('org-departments')
export class OrgDepartmentsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  /**
   * GET /api/org-departments
   * Frontend `EmployeeDialog → OrgStructureSection` ishlatadi.
   * `org_departments` jadvalidan camelCase JSON qaytaradi.
   */
  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getOrgDepartments(page, limit));
  }

  @Post('notify-vacancies')
  @HttpCode(HttpStatus.OK)
  async notifyVacancies() {
    return unwrapOrInternal(await this.svc.getVacantDepartments());
  }
}

@ApiTags('Org Functions (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('org-functions')
export class OrgFunctionsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  /** GET /api/org-functions — ro'yxat (dropdown uchun) */
  @Get()
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return unwrapOrInternal(await this.svc.getOrgFunctions(page, limit, departmentId));
  }

  /** POST /api/org-functions — yangi karta yaratish */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createOrgFunction(body as Record<string, unknown>));
  }

  /** PATCH /api/org-functions/:id — kartani yangilash */
  @Patch(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async update(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateOrgFunction(id, body as Record<string, unknown>));
  }

  /** DELETE /api/org-functions/:id — soft-delete */
  @Delete(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteOrgFunction(id));
  }
}

