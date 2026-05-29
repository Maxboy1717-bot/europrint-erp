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
import {
  MaterialCardAclTranslator,
  type LegacyMaterialCardRow,
  type MaterialCardDto,
} from './acl/material-card-acl';

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
}

@ApiTags('Material Cards (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director', 'warehouse_manager', 'warehouse_keeper')
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('material-cards')
export class MaterialCardsCompatController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly materialCardAcl = new MaterialCardAclTranslator();

  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return unwrapOrInternal(await this.svc.getMaterialCards(page, limit, search));
  }

  /**
   * PA2-14 ACL-translated variant. New BC-4 / BC-6 consumers should
   * target `/v2`; the legacy `/` endpoint stays for backwards-compat.
   */
  @Get('v2')
  async getAllV2(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<MaterialCardDto[]> {
    const rows = unwrapOrInternal(await this.svc.getMaterialCards(page, limit, search)) as unknown as LegacyMaterialCardRow[];
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map((row) => this.materialCardAcl.toDomain(row))
      .filter((r): r is { ok: true; data: MaterialCardDto } => r.ok)
      .map((r) => r.data);
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
  @HttpCode(HttpStatus.ACCEPTED)
  notifyVacancies() {
    return { message: 'Vakansiya bildirishnomalari navbatga qo\'yildi', queued: true };
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

  /**
   * GET /api/org-functions
   * Org-sxemadagi "Lavozim" (position) ro'yxati — `org_functions` jadvalidan
   * { id, name(=position_name), departmentId, ... } qaytaradi. Legacy
   * `/api/positions` o'rnini bosadi (dropdown'lar uchun org-sxema manba).
   */
  @Get()
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return unwrapOrInternal(await this.svc.getOrgFunctions(page, limit, departmentId));
  }
}

