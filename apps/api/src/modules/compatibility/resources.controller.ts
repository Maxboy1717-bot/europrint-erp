/**
 * @module resources.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
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

@ApiTags('Departments (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('departments')
export class DepartmentsCompatController {
  constructor(private readonly svc: ResourcesCompatService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getDepartments(page, limit));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getDepartment(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createDepartment(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateDepartment(id, body));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteDepartment(id));
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

@ApiTags('Positions (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('positions')
export class PositionsCompatController {
  constructor(
    private readonly svc: ResourcesCompatService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getPositions(page, limit, departmentId));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getPosition(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createPosition(body));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updatePosition(id, body));
  }

  @Patch(':id/kpi-template')
  async assignKpiTemplate(@Param('id') id: string, @Body('templateKey') templateKey: string) {
    if (!templateKey) throw new BadRequestException(await this.i18n.t('errors.templateKeyRequired'));
    return unwrapOrInternal(await this.svc.assignKpiTemplate(id, templateKey));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deletePosition(id));
  }
}
