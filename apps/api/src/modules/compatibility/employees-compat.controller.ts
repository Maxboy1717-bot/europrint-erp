/**
 * @module employees-compat.controller
 * @description NestJS controller. Core CRUD + org routes; delegates to services and returns unwrapped Result data.
 * Sub-resource routes live in employees-compat-sub.controller.ts.
 */

import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { EmployeesCompatService } from './employees-compat.service';
import { EmployeesCompatSubService } from './employees-compat-sub.service';
import { EmployeesListExtendedService } from './employees-list-extended.service';
import { CompatBodyDto, ImportEmployeesDto, OrgFunctionsDto, ProfileImageDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@Controller('employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class EmployeesCompatController {
  constructor(
    private readonly svc: EmployeesCompatService,
    private readonly subSvc: EmployeesCompatSubService,
    private readonly extendedSvc: EmployeesListExtendedService,
  ) {}

  // GET /api/employees — kengaytirilgan ro'yxat (frontend `Employees.tsx` kutadi: items + total)
  @Get()
  async listEmployees(
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const itemsRes = await this.extendedSvc.listExtended(status, departmentId, search, limit, offset);
    const totalRes = await this.extendedSvc.countExtended(status, departmentId, search);
    return {
      items: itemsRes.ok && Array.isArray(itemsRes.data) ? itemsRes.data : [],
      total: totalRes.ok && typeof totalRes.data === 'number' ? totalRes.data : 0,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEmployee(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createEmployee(body));
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async importEmployees(@Body() body: ImportEmployeesDto) {
    return unwrapOrInternal(await this.subSvc.importEmployees(body.employees ?? []));
  }

  @Get('for-face')
  async getEmployeesForFace() {
    return unwrapOrInternal(await this.svc.getEmployeesForFace());
  }

  @Get(':id')
  async getEmployee(@Param('id') id: string) {
    const r = await this.extendedSvc.getById(id);
    if (r.ok && r.data) return r.data;
    return unwrapOrInternal(await this.svc.getEmployee(id));
  }

  @Put(':id')
  async updateEmployee(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateEmployee(id, body));
  }

  @Delete(':id')
  async deleteEmployee(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteEmployee(id));
  }

  @Patch(':id/profile-image')
  async updateProfileImage(
    @Param('id') id: string,
    @Body() body: ProfileImageDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.updateProfileImage(id, body.url, user.id));
  }

  @Put(':id/profile-image')
  async updateProfileImagePut(
    @Param('id') id: string,
    @Body() body: ProfileImageDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.updateProfileImage(id, body.url, user.id));
  }

  @Patch(':id/org-functions')
  async assignOrgFunctions(
    @Param('id') id: string,
    @Body() body: OrgFunctionsDto,
  ) {
    return unwrapOrInternal(await this.svc.assignOrgFunctions(id, body));
  }

  @Post(':id/assign-org-functions')
  @HttpCode(HttpStatus.OK)
  async assignOrgFunctionsLegacy(
    @Param('id') id: string,
    @Body() body: OrgFunctionsDto,
  ) {
    return unwrapOrInternal(await this.svc.assignOrgFunctions(id, body));
  }

  /**
   * GET /api/employees/:id/org-departments
   * Xodim biriktirilgan barcha org_departments ID ro'yxati.
   * Frontend `EmployeeDialog → OrgStructureSection` edit rejimida ishlatadi —
   * pre-selected funksiyalarni ko'rsatish uchun.
   */
  @Get(':id/org-departments')
  async getOrgDepartments(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getEmployeeOrgDepartments(id));
  }
}
